<?php

namespace App\Services;

use App\Models\Pago;
use App\Models\Refund;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class PaymentService
{
    public function __construct()
    {
        // placeholder for future dependencies (e.g., logger, mailer)
    }

    /**
     * Determina si la reserva es elegible para reembolso (48h y pago pagado)
     */
    public function puedeReembolsar(Reserva $reserva): bool
    {
        try {
            $checkIn = \Carbon\Carbon::parse($reserva->check_in);
            $deadline = $checkIn->copy()->subHours(48);
            if (\Carbon\Carbon::now()->greaterThan($deadline)) {
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

    /**
     * Solicita un reembolso para la reserva: busca el pago, crea refund en Stripe y registra en BD.
     * Retorna array con keys: success (bool) y message (string).
     */
    public function solicitarReembolso(Reserva $reserva, $usuario, ?float $monto = null, bool $forceByAdmin = false): array
    {
        // Permisos: el usuario debe ser el reservable o el creador, salvo cuando lo fuerza un admin
        $esPropietario = false;
        try {
            $esPropietario = (
                ($reserva->reservable_type === get_class($usuario) && $reserva->reservable_id == $usuario->id)
                || $reserva->user_id == $usuario->id
                || $reserva->booked_by_user_id == $usuario->id
            );
        } catch (\Throwable $e) {
            $esPropietario = false;
        }

        if (! $esPropietario && ! $forceByAdmin) {
            return ['success' => false, 'message' => 'No autorizado para solicitar este reembolso.'];
        }

        if (! $this->puedeReembolsar($reserva)) {
            return ['success' => false, 'message' => 'No se puede solicitar reembolso con menos de 48 horas antes del check-in o reserva no pagada.'];
        }

        // Buscar pago preferente: último completado
        $pago = $reserva->pagos()->where('estado', 'completado')->orderByDesc('pagado_en')->first();
        if (! $pago) {
            $pago = Pago::where('reserva_id', $reserva->id)->whereNotNull('stripe_payment_intent_id')->orderByDesc('pagado_en')->first();
            if ($pago) {
                Log::info("PaymentService fallback: encontrado pago por reserva_id para reembolso: {$pago->id}");
            }
        }

        $payment_intent_id = $pago->stripe_payment_intent_id ?? null;

        if (empty($payment_intent_id) && $pago && !empty($pago->stripe_response)) {
            try {
                $resp = is_array($pago->stripe_response) ? $pago->stripe_response : (array)$pago->stripe_response;
                if (!empty($resp['id'])) {
                    $payment_intent_id = $resp['id'];
                } elseif (!empty($resp['payment_intent'])) {
                    $payment_intent_id = $resp['payment_intent'];
                } elseif (!empty($resp['charges']) && is_array($resp['charges']) && !empty($resp['charges']['data'][0]['payment_intent'])) {
                    $payment_intent_id = $resp['charges']['data'][0]['payment_intent'];
                }
                if ($payment_intent_id) {
                    Log::info("PaymentService: extraído payment_intent desde stripe_response del pago {$pago->id}: {$payment_intent_id}");
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo parsear stripe_response para extraer payment_intent: ' . $e->getMessage());
            }
        }

        // Intentar buscar en Stripe por metadata.localizador si aún no tenemos payment_intent
        if (empty($payment_intent_id)) {
            try {
                $stripeClient = new StripeClient(config('services.stripe.secret'));
                $query = "metadata['localizador']:'{$reserva->localizador}'";
                $search = $stripeClient->paymentIntents->search(['query' => $query, 'limit' => 1]);
                if (!empty($search->data) && count($search->data) > 0) {
                    $pi = $search->data[0];
                    $payment_intent_id = $pi->id ?? null;
                    Log::info("PaymentService: encontrado PaymentIntent en Stripe por metadata.localizador={$reserva->localizador}: {$payment_intent_id}");
                }
            } catch (\Throwable $e) {
                Log::warning('PaymentService: Error buscando PaymentIntent en Stripe por metadata.localizador: ' . $e->getMessage());
            }
        }

        if (! $pago || empty($payment_intent_id)) {
            return ['success' => false, 'message' => 'No se encontró un pago válido para reembolsar.'];
        }


        // Permitir reembolsos parciales: calcular cuánto queda disponible para reembolsar
        $alreadyRefundedCents = Refund::where('pago_id', $pago->id)->sum('amount_cents') ?: 0;
        $pagoAmountCents = isset($pago->monto) ? intval(round($pago->monto * 100)) : 0;
        $remainingCents = max(0, $pagoAmountCents - $alreadyRefundedCents);

        if ($remainingCents <= 0) {
            return ['success' => false, 'message' => 'Ya no queda importe disponible para reembolsar en este pago.'];
        }

        // Determinar importe a reembolsar (en céntimos)
        if ($monto === null) {
            $refundAmountCents = $remainingCents; // reembolso total del resto pendiente
        } else {
            $requestedCents = intval(round($monto * 100));
            if ($requestedCents <= 0) {
                return ['success' => false, 'message' => 'Importe de reembolso inválido.'];
            }
            if ($requestedCents > $remainingCents) {
                return ['success' => false, 'message' => 'El importe solicitado excede el disponible para reembolsar.', 'available_cents' => $remainingCents];
            }
            $refundAmountCents = $requestedCents;
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            $refundParams = ['payment_intent' => $payment_intent_id];
            if ($refundAmountCents > 0) {
                $refundParams['amount'] = $refundAmountCents;
            }
            Log::info('Stripe refund params: ' . json_encode($refundParams));
            $refund = $stripe->refunds->create($refundParams);

            $createdRefund = Refund::create([
                'pago_id' => $pago->id,
                'reserva_id' => $reserva->id,
                'stripe_refund_id' => $refund->id ?? null,
                'amount_cents' => $refund->amount ?? null,
                'currency' => $refund->currency ?? null,
                'status' => $refund->status ?? null,
                'stripe_response' => $refund->toArray(),
            ]);

            Log::info('Refund creado en Stripe: ' . json_encode([ 'id' => $refund->id ?? null, 'amount' => $refund->amount ?? null, 'status' => $refund->status ?? null ]));

            // Ensure there's a RefundRequest record reflecting this processed refund so admins see it in the same table
            try {
                $refundCents = isset($refund->amount) ? intval($refund->amount) : $refundAmountCents;

                // Try to find a matching pending request for this reserva and amount
                $existingRequest = \App\Models\RefundRequest::where('reserva_id', $reserva->id)
                    ->where(function ($q) use ($refundCents) {
                        $q->where('requested_amount_cents', $refundCents)
                          ->orWhereNull('requested_amount_cents');
                    })->where('status', 'pending')->first();

                if ($existingRequest) {
                    $existingRequest->update([
                        'status' => 'approved',
                        'admin_id' => ($forceByAdmin && $usuario && isset($usuario->id) && $usuario->is_admin) ? $usuario->id : $existingRequest->admin_id,
                        'admin_reason' => $forceByAdmin ? 'Procesado por admin' : ($existingRequest->admin_reason ?? null),
                        'processed_at' => now(),
                        'pago_id' => $pago->id,
                        'stripe_refund_id' => $refund->id ?? null,
                        'requested_amount_cents' => $refundCents,
                    ]);
                } else {
                    // Create an approved RefundRequest to reflect this refund
                    \App\Models\RefundRequest::create([
                        'reserva_id' => $reserva->id,
                        'pago_id' => $pago->id,
                        'requested_amount_cents' => $refundCents,
                        'reason_code' => $forceByAdmin ? 'admin' : 'automatic',
                        'notes' => $forceByAdmin ? 'Procesado por admin' : 'Reembolso automático generado por sistema',
                        'user_id' => $reserva->user_id ?? $pago->user_id ?? null,
                        'status' => 'approved',
                        'admin_id' => ($forceByAdmin && $usuario && isset($usuario->id) && $usuario->is_admin) ? $usuario->id : null,
                        'processed_at' => now(),
                        'stripe_refund_id' => $refund->id ?? null,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo crear/actualizar RefundRequest para refund: ' . $e->getMessage());
            }

            // Calcular reembolsos totales realizados sobre la reserva (suma de amount_cents)
            try {
                $totalRefundedForReservaCents = Refund::where('reserva_id', $reserva->id)->sum('amount_cents') ?: 0;
                // El refund que acabamos de crear ya está en BD, así que no es necesario sumarlo manualmente
                $reservaAmountCents = isset($reserva->precio_total) ? intval(round($reserva->precio_total * 100)) : null;

                try {
                    $totalPaidForReservaCents = intval(round(Pago::where('reserva_id', $reserva->id)->sum('monto') * 100));
                } catch (\Throwable $e) {
                    $totalPaidForReservaCents = $reservaAmountCents ?? 0;
                }

                Log::info('Post-refund totals', [
                    'reserva_id' => $reserva->id,
                    'pago_id' => $pago->id,
                    'payment_intent' => $payment_intent_id,
                    'refund_id' => $refund->id ?? null,
                    'refund_amount_cents' => $refund->amount ?? null,
                    'total_refunded_for_reserva_cents' => $totalRefundedForReservaCents,
                    'total_paid_for_reserva_cents' => $totalPaidForReservaCents,
                ]);

                if ($totalPaidForReservaCents > 0 && $totalRefundedForReservaCents >= $totalPaidForReservaCents) {
                    // Reembolso completo sobre la reserva: cancelar reserva
                    Log::info('solicitarReembolso: marcando reserva como devuelto (pre-update)', [
                        'reserva_id' => $reserva->id,
                        'pago_id' => $pago->id,
                        'payment_intent' => $payment_intent_id,
                        'total_refunded_for_reserva_cents' => $totalRefundedForReservaCents,
                        'total_paid_for_reserva_cents' => $totalPaidForReservaCents,
                        'stack' => array_slice(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5), 0, 5),
                    ]);
                    try { $pago->update(['estado' => 'cancelado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago tras reembolso completo: ' . $e->getMessage()); }
                    try {
                        $reserva->update(['pago' => 'devuelto', 'status' => 'cancelado']);
                        Log::info('solicitarReembolso: reserva marcada como devuelto (post-update)', ['reserva_id' => $reserva->id]);
                    } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de reserva tras reembolso completo: ' . $e->getMessage()); }
                } else {
                    // Parcial: no cancelar la reserva; mantener `reserva.pago` como pagado y marcar pago como reembolsado parcial
                    try { $pago->update(['estado' => 'reembolsado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago tras reembolso parcial: ' . $e->getMessage()); }
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo actualizar estado de pago/reserva tras reembolso: ' . $e->getMessage());
            }

            $refundAmount = isset($refund->amount) ? ($refund->amount / 100) : ($refundAmountCents / 100);

            return ['success' => true, 'message' => 'Reembolso solicitado correctamente.', 'refund_amount' => round($refundAmount, 2), 'refund_id' => $refund->id ?? null];
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
     * Maneja un evento de reembolso/charge.refunded desde Stripe.
     * Acepta el objeto de refund/charge (puede venir como stdClass/array) y crea/actualiza Refund en BD.
     */
    public function manejarEventoReembolso($refundObj): void
    {
        try {
            // Para 'charge.refunded' el objeto puede ser un Charge con 'refunds' o un Refund directo
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

            // Buscar pago por payment_intent o por charge
            $pago = null;
            if (!empty($refundData->payment_intent)) {
                $pago = Pago::where('stripe_payment_intent_id', $refundData->payment_intent)->first();
            }
            if (!$pago && !empty($refundData->charge)) {
                $pago = Pago::whereJsonContains('stripe_response', ['charge' => $refundData->charge])->first();
            }

            // Si no encontramos por payment_intent/charge, intentar recuperar metadata del payment_intent en Stripe
            if (!$pago && !empty($refundData->payment_intent)) {
                try {
                    $stripeClient = new StripeClient(config('services.stripe.secret'));
                    $pi = $stripeClient->paymentIntents->retrieve($refundData->payment_intent, []);
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

                    // Also create or update a RefundRequest reflecting this refund (approved)
                    try {
                        $refundCents = isset($refundData->amount) ? intval($refundData->amount) : 0;

                        // If a RefundRequest already exists referencing this stripe refund id, update it
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
                    // Si este refund todavía no existe en BD, sumar su importe (webhooks a veces llegan antes)
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
                        // Reembolso completo sobre la reserva: marcar pago como cancelado y reservar como devuelto/cancelado
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
                        // Reembolso parcial: sólo marcar el registro de pago como reembolsado parcialmente.
                        // No cambiar el flag `reserva.pago` para evitar mostrar "devuelto" cuando la reserva sigue pagada.
                        $pago->update(['estado' => 'reembolsado']);
                    }
                } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago/reserva desde PaymentService.manejarEventoReembolso: ' . $e->getMessage()); }
            }
        } catch (\Throwable $e) {
            Log::error('PaymentService.manejarEventoReembolso error: ' . $e->getMessage());
        }
    }
}
