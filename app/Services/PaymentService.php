<?php

namespace App\Services;

use App\Models\Pago;
use App\Models\Refund;
use App\Models\RefundRequest;
use App\Models\Reserva;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class PaymentService
{
    private StripeClient $stripeClient;

    public function __construct(?StripeClient $stripeClient = null)
    {
        $this->stripeClient = $stripeClient ?? new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Determina si la reserva es elegible para reembolso (48h y pago pagado)
     */
    public function puedeReembolsar(Reserva $reserva): bool
    {
        try {
            $checkIn = Carbon::parse($reserva->check_in);
            $limite = $checkIn->copy()->subHours(48);

            if ( Carbon::now()->greaterThan($limite) ) {
                return false;
            }

            if (strtolower($reserva->pago) !== 'pagado') {
                return false;
            }

            return true;

        } catch (\Throwable $e) {
            Log::warning('Error evaluando puedeReembolsar en PaymentService: ' . $e->getMessage());
            return false;
        }
    }


    public function solicitarReembolso(Reserva $reserva, $usuario, ?float $monto = null, bool $forzarPorAdmin = false): array
    {
        // Authorization and policy check
        if (! $this->autorizarSolicitudReembolso($reserva, $usuario, $forzarPorAdmin)) {
            return ['success' => false, 'message' => 'No autorizado para solicitar este reembolso.'];
        }

        if (! $forzarPorAdmin && ! $this->puedeReembolsar($reserva)) {
            return ['success' => false, 'message' => 'No se puede solicitar reembolso con menos de 48 horas antes del check-in o reserva no pagada.'];
        }

        $pago = $this->encontrarPagoParaReembolso($reserva);
        if (! $pago) {
            return ['success' => false, 'message' => 'No se encontró un pago válido para reembolsar.'];
        }

        $idIntentoPago = $this->extraerIdIntentoPago($pago) ?? $this->buscarIntentoPagoEnStripePorLocalizador($reserva->localizador);
        if (empty($idIntentoPago)) {
            return ['success' => false, 'message' => 'No se encontró un PaymentIntent asociado al pago.'];
        }

        $centimosRestantes = $this->calcularCentimosRestantes($pago);
        if ($centimosRestantes <= 0) {
            return ['success' => false, 'message' => 'Ya no queda importe disponible para reembolsar en este pago.'];
        }

        // Determinar importe a reembolsar
        if ($monto === null) {
            $centimosReembolso = $centimosRestantes;
        } else {
            $centimosSolicitados = intval(round($monto * 100));
            if ($centimosSolicitados <= 0) return ['success' => false, 'message' => 'Importe de reembolso inválido.'];
            if ($centimosSolicitados > $centimosRestantes) return ['success' => false, 'message' => 'El importe solicitado excede el disponible para reembolsar.', 'available_cents' => $centimosRestantes];
            $centimosReembolso = $centimosSolicitados;
        }

        // Create refund in Stripe
        try {
            $reembolso = $this->crearReembolsoEnStripe($idIntentoPago, $centimosReembolso);
            if (! $reembolso) {
                return ['success' => false, 'message' => 'Error al solicitar reembolso en Stripe.'];
            }

            // Registrar en BD y actualizar estados
            $this->registrarReembolsoYSolicitudes($pago, $reserva, $reembolso, $centimosReembolso, $usuario, $forzarPorAdmin);
            $this->actualizarEstadoPagoYReserva($pago, $reserva);

            $montoReembolso = isset($reembolso->amount) ? ($reembolso->amount / 100) : ($centimosReembolso / 100);

            return ['success' => true, 'message' => 'Reembolso solicitado correctamente.', 'refund_amount' => round($montoReembolso, 2), 'refund_id' => $reembolso->id ?? null];
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe Refund Error: ' . $e->getMessage());
            $msg = $e->getMessage();
            if (stripos($msg, 'already been refunded') !== false || stripos($msg, 'already refunded') !== false) {
                return ['success' => false, 'message' => 'El cargo ya ha sido reembolsado anteriormente.'];
            }
            return ['success' => false, 'message' => 'Error al solicitar reembolso en Stripe.'];
        } catch (\Throwable $e) {
            Log::error('PaymentService Refund Error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error interno al procesar reembolso.'];
        }
    }

    /**
     * Helpers
     */
    private function autorizarSolicitudReembolso(Reserva $reserva, $usuario, bool $forzarPorAdmin): bool
    {
        if ($forzarPorAdmin) return true;

        try {
            return (
                ($reserva->reservable_type === get_class($usuario) && $reserva->reservable_id == $usuario->id)
                || $reserva->user_id == ($usuario->id ?? null)
                || $reserva->booked_by_user_id == ($usuario->id ?? null)
            );
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function encontrarPagoParaReembolso(Reserva $reserva): ?Pago
    {
        $pago = $reserva->pagos()->where('estado', 'completado')->orderByDesc('pagado_en')->first();
        if ($pago) return $pago;

        $pago = Pago::where('reserva_id', $reserva->id)->whereNotNull('stripe_payment_intent_id')->orderByDesc('pagado_en')->first();
        if ($pago) {
            Log::info("PaymentService fallback: encontrado pago por reserva_id para reembolso: {$pago->id}");
            return $pago;
        }

        return null;
    }

    private function extraerIdIntentoPago(Pago $pago): ?string
    {
        if (!empty($pago->stripe_payment_intent_id)) return $pago->stripe_payment_intent_id;

        if (empty($pago->stripe_response)) return null;

        try {
            $resp = is_array($pago->stripe_response) ? $pago->stripe_response : (array)$pago->stripe_response;
            if (!empty($resp['id'])) return $resp['id'];
            if (!empty($resp['payment_intent'])) return $resp['payment_intent'];
            if (!empty($resp['charges']) && is_array($resp['charges']) && !empty($resp['charges']['data'][0]['payment_intent'])) return $resp['charges']['data'][0]['payment_intent'];
        } catch (\Throwable $e) {
            Log::warning('No se pudo parsear stripe_response para extraer payment_intent: ' . $e->getMessage());
        }

        return null;
    }

    private function buscarIntentoPagoEnStripePorLocalizador(string $localizador): ?string
    {
        try {
            $consulta = "metadata['localizador']:'{$localizador}'";
            $search = $this->stripeClient->paymentIntents->search(['query' => $consulta, 'limit' => 1]);
            if (!empty($search->data) && count($search->data) > 0) {
                $pi = $search->data[0];
                $id = $pi->id ?? null;
                if ($id) Log::info("PaymentService: encontrado PaymentIntent en Stripe por metadata.localizador={$localizador}: {$id}");
                return $id;
            }
        } catch (\Throwable $e) {
            Log::warning('PaymentService: Error buscando PaymentIntent en Stripe por metadata.localizador: ' . $e->getMessage());
        }

        return null;
    }

    private function calcularCentimosRestantes(Pago $pago): int
    {
        $centimosYaReembolsados = Refund::where('pago_id', $pago->id)->sum('amount_cents') ?: 0;
        $centimosPago = isset($pago->monto) ? intval(round($pago->monto * 100)) : 0;
        return max(0, $centimosPago - $centimosYaReembolsados);
    }

    private function crearReembolsoEnStripe(string $idIntentoPago, int $centimos)
    {
        $params = ['payment_intent' => $idIntentoPago];
        if ($centimos > 0) $params['amount'] = $centimos;

        Log::info('Stripe refund params: ' . json_encode($params));

        try {
            return $this->stripeClient->refunds->create($params);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            throw $e;
        }
    }

    private function registrarReembolsoYSolicitudes(Pago $pago, Reserva $reserva, $reembolso, int $centimosReembolso, $usuario, bool $forzarPorAdmin): ?Refund
    {
        try {
            $createdRefund = Refund::create([
                'pago_id' => $pago->id,
                'reserva_id' => $reserva->id,
                'stripe_refund_id' => $reembolso->id ?? null,
                'amount_cents' => $reembolso->amount ?? $centimosReembolso,
                'currency' => $reembolso->currency ?? null,
                'status' => $reembolso->status ?? null,
                'stripe_response' => is_object($reembolso) ? (array)$reembolso : $reembolso,
            ]);

            $refundCents = isset($reembolso->amount) ? intval($reembolso->amount) : $centimosReembolso;

            $existingRequest = \App\Models\RefundRequest::where('reserva_id', $reserva->id)
                ->where(function ($q) use ($refundCents) {
                    $q->where('requested_amount_cents', $refundCents)
                      ->orWhereNull('requested_amount_cents');
                })->where('status', 'pending')->first();

            if ($existingRequest) {
                $existingRequest->update([
                    'status' => 'approved',
                    'admin_id' => ($forzarPorAdmin && $usuario && isset($usuario->id)) ? $usuario->id : $existingRequest->admin_id,
                    'admin_reason' => $forzarPorAdmin ? 'Procesado por admin' : ($existingRequest->admin_reason ?? null),
                    'processed_at' => now(),
                    'pago_id' => $pago->id,
                    'stripe_refund_id' => $reembolso->id ?? null,
                    'requested_amount_cents' => $refundCents,
                ]);
            } else {
                RefundRequest::create([
                    'reserva_id' => $reserva->id,
                    'pago_id' => $pago->id,
                    'requested_amount_cents' => $refundCents,
                    'reason_code' => $forzarPorAdmin ? 'admin' : 'automatic',
                    'notes' => $forzarPorAdmin ? 'Procesado por admin' : 'Reembolso automático generado por sistema',
                    'user_id' => $reserva->user_id ?? $pago->user_id ?? null,
                    'status' => 'approved',
                    'admin_id' => ($forzarPorAdmin && $usuario && isset($usuario->id)) ? $usuario->id : null,
                    'processed_at' => now(),
                    'stripe_refund_id' => $reembolso->id ?? null,
                ]);
            }

            return $createdRefund;
        } catch (\Throwable $e) {
            Log::warning('No se pudo crear/actualizar RefundRequest para refund: ' . $e->getMessage());
            return null;
        }
    }

    private function actualizarEstadoPagoYReserva(Pago $pago, Reserva $reserva): void
    {
        try {
            $totalRefundedForReservaCents = Refund::where('reserva_id', $reserva->id)->sum('amount_cents') ?: 0;
            $reservaAmountCents = isset($reserva->precio_total) ? intval(round($reserva->precio_total * 100)) : null;

            try {
                $totalPaidForReservaCents = intval(round(Pago::where('reserva_id', $reserva->id)->sum('monto') * 100));
            } catch (\Throwable $e) {
                $totalPaidForReservaCents = $reservaAmountCents ?? 0;
            }

            Log::info('Post-refund totals', [
                'reserva_id' => $reserva->id,
                'pago_id' => $pago->id,
                'refund_amounts_total' => $totalRefundedForReservaCents,
                'total_paid_for_reserva_cents' => $totalPaidForReservaCents,
            ]);

            if ($totalPaidForReservaCents > 0 && $totalRefundedForReservaCents >= $totalPaidForReservaCents) {
                try { $pago->update(['estado' => 'cancelado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago tras reembolso completo: ' . $e->getMessage()); }
                try { $reserva->update(['pago' => 'devuelto', 'status' => 'cancelado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de reserva tras reembolso completo: ' . $e->getMessage()); }
            } else {
                try { $pago->update(['estado' => 'reembolsado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago tras reembolso parcial: ' . $e->getMessage()); }
            }
        } catch (\Throwable $e) {
            Log::warning('No se pudo actualizar estado de pago/reserva tras reembolso: ' . $e->getMessage());
        }
    }


    public function manejarEventoReembolso($refundObj): void
    {
        try {
            if (is_object($refundObj) && property_exists($refundObj, 'refunds')) {
                $charge = $refundObj;
                $refunds = $charge->refunds ?? null;
                if ($refunds && isset($refunds->data) && count($refunds->data) > 0) {
                    $single = end($refunds->data);
                    $refundData = $single;
                } else {
                    $refundData = null;
                }
            } else {
                $refundData = $refundObj;
            }

            if (empty($refundData)) return;

            $pago = null;
            if (!empty($refundData->payment_intent)) {
                $pago = Pago::where('stripe_payment_intent_id', $refundData->payment_intent)->first();
            }
            if (!$pago && !empty($refundData->charge)) {
                $pago = Pago::whereJsonContains('stripe_response', ['charge' => $refundData->charge])->first();
            }

            if (!$pago && !empty($refundData->payment_intent)) {
                try {
                    $clienteStripe = new StripeClient(config('services.stripe.secret'));
                    $pi = $clienteStripe->paymentIntents->retrieve($refundData->payment_intent, []);
                    $metadata = $pi->metadata ?? null;
                    if (!empty($metadata) && !empty($metadata->localizador)) {
                        $localizador = $metadata->localizador;
                        $pago = Pago::whereHas('reserva', function ($q) use ($localizador) {
                            $q->where('localizador', $localizador);
                        })->where('estado', 'completado')->orderByDesc('pagado_en')->first();
                    }
                } catch (\Throwable $e) {
                    Log::warning('PaymentService.manejarEventoReembolso: no se pudo recuperar PaymentIntent desde Stripe: ' . $e->getMessage());
                }
            }

            if ($pago) {
                $existing = Refund::where('stripe_refund_id', $refundData->id)->first();
                if (!$existing) {
                    $created = Refund::create([
                        'pago_id' => $pago->id,
                        'reserva_id' => $pago->reserva_id,
                        'stripe_refund_id' => $refundData->id ?? null,
                        'amount_cents' => $refundData->amount ?? null,
                        'currency' => $refundData->currency ?? null,
                        'status' => $refundData->status ?? null,
                        'reason' => $refundData->reason ?? null,
                        'stripe_response' => is_object($refundData) ? (array)$refundData : $refundData,
                    ]);

                    try {
                        $refundCents = isset($refundData->amount) ? intval($refundData->amount) : 0;

                        $existingByStripe = null;
                        if (!empty($refundData->id)) {
                            $existingByStripe = \App\Models\RefundRequest::where('stripe_refund_id', $refundData->id)->first();
                        }

                        if ($existingByStripe) {
                            $existingByStripe->update([
                                'status' => 'approved',
                                'admin_reason' => $existingByStripe->admin_reason ?? 'Procesado automáticamente desde webhook',
                                'processed_at' => now(),
                                'pago_id' => $pago->id,
                                'stripe_refund_id' => $refundData->id ?? null,
                                'requested_amount_cents' => $refundCents,
                            ]);
                        } else {
                            $existingRequest = \App\Models\RefundRequest::where('reserva_id', $pago->reserva_id)
                                ->where(function ($q) use ($refundCents) {
                                    $q->where('requested_amount_cents', $refundCents)
                                      ->orWhereNull('requested_amount_cents');
                                })->where('status', 'pending')->first();

                            if ($existingRequest) {
                                $existingRequest->update([
                                    'status' => 'approved',
                                    'admin_reason' => $existingRequest->admin_reason ?? 'Procesado automáticamente desde webhook',
                                    'processed_at' => now(),
                                    'pago_id' => $pago->id,
                                    'stripe_refund_id' => $refundData->id ?? null,
                                    'requested_amount_cents' => $refundCents,
                                ]);
                            } else {
                                \App\Models\RefundRequest::create([
                                    'reserva_id' => $pago->reserva_id,
                                    'pago_id' => $pago->id,
                                    'requested_amount_cents' => $refundCents,
                                    'reason_code' => 'stripe_webhook',
                                    'notes' => 'Reembolso procesado vía webhook',
                                    'user_id' => $pago->user_id ?? null,
                                    'status' => 'approved',
                                    'processed_at' => now(),
                                    'stripe_refund_id' => $refundData->id ?? null,
                                ]);
                            }
                        }
                    } catch (\Throwable $e) {
                        Log::warning('No se pudo crear/actualizar RefundRequest desde webhook: ' . $e->getMessage());
                    }
                }

                try {
                    Log::info('PaymentService: refund received', ['refund' => is_object($refundData) ? (array)$refundData : $refundData]);
                    $refundAmountCents = isset($refundData->amount) ? intval($refundData->amount) : 0;
                    $totalRefundedForReservaCents = Refund::where('reserva_id', $pago->reserva_id)->sum('amount_cents') ?: 0;
                    $refundExists = Refund::where('stripe_refund_id', $refundData->id)->exists();
                    if (!$refundExists && $refundAmountCents > 0) {
                        $totalRefundedForReservaCents += $refundAmountCents;
                    }

                    $reservaAmountCents = isset($pago->reserva->precio_total) ? intval(round($pago->reserva->precio_total * 100)) : null;

                    try {
                        $totalPaidForReservaCents = intval(round(Pago::where('reserva_id', $pago->reserva_id)->sum('monto') * 100));
                    } catch (\Throwable $e) {
                        $totalPaidForReservaCents = $reservaAmountCents ?? 0;
                    }

                    Log::info('PaymentService totals', [
                        'reserva_id' => $pago->reserva_id,
                        'pago_id' => $pago->id,
                        'refund_id' => $refundData->id ?? null,
                        'refund_amount_cents' => $refundAmountCents,
                        'total_refunded_for_reserva_cents' => $totalRefundedForReservaCents,
                        'total_paid_for_reserva_cents' => $totalPaidForReservaCents,
                    ]);

                    if ($totalPaidForReservaCents > 0 && $totalRefundedForReservaCents >= $totalPaidForReservaCents) {
                        Log::info('PaymentService: marcando reserva como devuelto (pre-update)', [
                            'reserva_id' => $pago->reserva_id,
                            'pago_id' => $pago->id,
                            'refund_id' => $refundData->id ?? null,
                            'total_refunded_for_reserva_cents' => $totalRefundedForReservaCents,
                            'total_paid_for_reserva_cents' => $totalPaidForReservaCents,
                            'stack' => array_slice(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5), 0, 5),
                        ]);
                        $pago->update(['estado' => 'cancelado']);
                        $pago->reserva->update(['pago' => 'devuelto', 'status' => 'cancelado']);
                        Log::info('PaymentService: reserva marcada como devuelto (post-update)', ['reserva_id' => $pago->reserva_id]);
                    } else {
                        $pago->update(['estado' => 'reembolsado']);
                    }
                } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago/reserva desde PaymentService.manejarEventoReembolso: ' . $e->getMessage()); }
            }
        } catch (\Throwable $e) {
            Log::error('PaymentService.manejarEventoReembolso error: ' . $e->getMessage());
        }
    }
}
