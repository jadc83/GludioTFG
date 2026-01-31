<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\ReservaService;
use App\Services\PaymentService;

class PagoController extends Controller
{
    private PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        Stripe::setApiKey(config('services.stripe.secret'));
        $this->paymentService = $paymentService;
    }

    /**
     * Crear un PaymentIntent para la reserva
     */
    public function crearPaymentIntent(Request $request)
    {
        $validated = $request->validate([
            'reserva_id' => 'required|integer|exists:reservas,id',
            'monto' => 'required|numeric|min:0.01',
            'subtotal_habitaciones' => 'nullable|numeric|min:0',
            'precioTarifas' => 'nullable|numeric|min:0',
        ]);

        try {
            // Verificar que la clave secreta de Stripe está configurada
            if (!config('services.stripe.secret')) {
                throw new \Exception('STRIPE_SECRET_KEY no está configurada en .env');
            }

            $reserva = Reserva::findOrFail($validated['reserva_id']);

            // Crear PaymentIntent en Stripe
            // Incluimos receipt_email para que Stripe pueda enviar recibos si está habilitado
            $receiptEmail = $reserva->reservable?->email ?? $request->input('email') ?? null;

            $intentData = [
                'amount' => (int)round($validated['monto'] * 100), // Stripe usa centavos
                'currency' => 'eur',
                // Usar automatic_payment_methods y deshabilitar redirects para evitar métodos que requieran return_url
                'automatic_payment_methods' => ['enabled' => true, 'allow_redirects' => 'never'],
                'metadata' => [
                    'reserva_id' => $reserva->id,
                    'localizador' => $reserva->localizador,
                ],
                'description' => "Pago de reserva {$reserva->localizador}",
            ];

            // Añadir desglose al metadata si viene
            if (isset($validated['subtotal_habitaciones'])) {
                $intentData['metadata']['subtotal_habitaciones'] = (string)round($validated['subtotal_habitaciones'], 2);
            }
            if (isset($validated['precioTarifas'])) {
                $intentData['metadata']['precioTarifas'] = (string)round($validated['precioTarifas'], 2);
            }

            if ($receiptEmail) {
                $intentData['receipt_email'] = $receiptEmail;
            }

            // If running locally or client requests it, confirm immediately with Stripe test PM
            $shouldConfirmWithTestPM = $request->boolean('confirm_with_pm') || app()->isLocal();
            if ($shouldConfirmWithTestPM) {
                $intentData['confirm'] = true;
                $intentData['payment_method'] = 'pm_card_visa';
            }

            $paymentIntent = PaymentIntent::create($intentData);

            // Guardar registro de pago
            $pago = Pago::create([
                'reserva_id' => $reserva->id,
                'stripe_payment_intent_id' => $paymentIntent->id,
                'monto' => $validated['monto'],
                'moneda' => 'eur',
                'estado' => 'procesando',
                'descripcion' => "Pago de reserva {$reserva->localizador}",
                'stripe_response' => $paymentIntent->toArray(),
            ]);

            // If the PaymentIntent was confirmed successfully, update pago status
            if (isset($paymentIntent->status) && $paymentIntent->status === 'succeeded') {
                try {
                    $pago->update(['estado' => 'completado', 'pagado_en' => now(), 'stripe_response' => $paymentIntent->toArray()]);
                } catch (\Throwable $e) {
                    Log::warning('No se pudo actualizar Pago tras confirmacion automática: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'clientSecret' => $paymentIntent->client_secret,
                'pago_id' => $pago->id,
                'reserva_id' => $reserva->id,
                // Exponer estado/id del PaymentIntent para que el cliente pueda
                // decidir si debe intentar confirmar con Stripe o delegar
                'paymentIntentId' => $paymentIntent->id ?? null,
                'paymentIntentStatus' => $paymentIntent->status ?? null,
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el pago. Por favor, intenta con una tarjeta diferente.',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Payment Intent Error: ' . $e->getMessage());

            if (str_contains($e->getMessage(), 'llave duplicada') || str_contains($e->getMessage(), 'UNIQUE')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Los datos ya están registrados en el sistema.',
                ], 400);
            }

            return response()->json([
                'success' => false,
                'error' => 'No se pudo crear la reserva. Por favor, intenta nuevamente.',
            ], 400);
        }
    }

    /**
     * Confirmar pago
     */
    public function confirmarPago(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'pago_id' => 'required|exists:pagos,id',
        ]);

        $pago = Pago::findOrFail($request->pago_id);

        try {
            // Obtener PaymentIntent de Stripe
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status === 'succeeded') {
                // Marcar pago como completado
                $pago->marcarComoPagado();

                // Actualizar estado de reserva
                $pago->reserva->update(['pago' => 'pagado']);

                // Enviar notificación centralizada (evitar duplicados con idempotencia)
                try {
                    $reserva = $pago->reserva->fresh(['reservable', 'pagos']);
                    $notifiable = $reserva->reservable;

                    // Comprueba si ya existe una notificación de pago para este pago
                    $exists = \Illuminate\Support\Facades\DB::table('notifications')
                        ->where('type', '\\App\\Notifications\\PagoConfirmadoNotification')
                        ->whereRaw("(data->>'pago_id')::int = ?", [$pago->id])
                        ->exists();

                    if (! $exists) {
                        if ($notifiable && method_exists($notifiable, 'notify')) {
                            $notifiable->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
                        } else {
                            // Fallback a route mail
                            \Illuminate\Support\Facades\Notification::route('mail', $reserva->reservable?->email ?? null)
                                ->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('No se pudo notificar confirmación de pago: ' . $e->getMessage());
                }

                return response()->json([ 'success' => true, 'message' => 'Pago completado exitosamente',
                    'reserva_id' => $pago->reserva_id, 'localizador' => $pago->reserva->localizador, 'pago_id' => $pago->id ]);

            } else {

                $pago->marcarComoFallido();

                return response()->json([ 'success' => false, 'message' => 'El pago no se pudo procesar' ], 400);
            }
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API error confirming payment: ' . $e->getMessage(), ['exception' => $e]);
            $pago->marcarComoFallido();
            return response()->json([ 'success' => false, 'error' => 'Error al confirmar el pago (Stripe API).'], 400);
        } catch (\Exception $e) {
            $pago->marcarComoFallido();
            Log::error('Confirmar Pago Error: ' . $e->getMessage());

            return response()->json([ 'success' => false, 'error' => 'No se pudo confirmar el pago. Por favor, intenta nuevamente.' ], 400);
        }
    }

    /**
     * Webhook de Stripe
     */
    public function webhook(Request $request)
    {
        $endpointSecret = config('services.stripe.webhook_secret');

        $payload = @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? null;

        try {
            $event = \Stripe\Webhook::constructEvent( $payload, $sig_header, $endpointSecret );
            \Illuminate\Support\Facades\Log::info('Stripe webhook received', ['type' => $event->type, 'id' => $event->id ?? null]);

            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent = $event->data->object;

                $pago = Pago::where('stripe_payment_intent_id', $paymentIntent->id)->first();
                if ($pago) {
                    $pago->marcarComoPagado();
                    $pago->reserva->update(['pago' => 'pagado']);
                    // Enviar notificación centralizada desde webhook (evitar duplicados)
                    try {
                        $reserva = $pago->reserva->fresh(['reservable', 'pagos']);
                        $notifiable = $reserva->reservable;

                        $exists = \Illuminate\Support\Facades\DB::table('notifications')
                            ->where('type', '\\App\\Notifications\\PagoConfirmadoNotification')
                            ->whereRaw("(data->>'pago_id')::int = ?", [$pago->id])
                            ->exists();

                        if (! $exists) {
                            if ($notifiable && method_exists($notifiable, 'notify')) {
                                $notifiable->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
                            } else {
                                \Illuminate\Support\Facades\Notification::route('mail', $reserva->reservable?->email ?? null)
                                    ->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
                            }
                        }
                    } catch (\Throwable $e) {
                        Log::warning('No se pudo notificar confirmación de pago (webhook): ' . $e->getMessage());
                    }
                }
            } elseif ($event->type === 'payment_intent.payment_failed') {
                $paymentIntent = $event->data->object;

                $pago = Pago::where('stripe_payment_intent_id', $paymentIntent->id)->first();
                if ($pago) {
                    $pago->marcarComoFallido();
                }
            } elseif (in_array($event->type, ['charge.refunded', 'refund.updated', 'refund.created'])) {
                try {
                    $refundObj = $event->data->object;
                    $this->paymentService->manejarEventoReembolso($refundObj);
                } catch (\Throwable $e) {
                    Log::error('Error delegando evento de reembolso al servicio: ' . $e->getMessage());
                }
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Reembolsar una reserva: busca el último pago completado y crea un reembolso en Stripe.
     */
    public function reembolsarReserva(Request $request, Reserva $reserva)
    {
        $validated = $request->validate([
            'monto' => 'nullable|numeric|min:0.01',
            'cancelar' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $monto = $validated['monto'] ?? null;
        $cancelar = $validated['cancelar'] ?? false;
        $resultado = $this->paymentService->solicitarReembolso($reserva, $user, $monto);
        $status = $resultado['success'] ? 200 : 400;
        if (isset($resultado['status_code'])) {
            $status = $resultado['status_code'];
        }
        // si reembolso fue exitoso forzar marcar la reserva como cancelada
        if ($resultado['success'] && $cancelar) {
            try {
                \Illuminate\Support\Facades\Log::info('reembolsarReserva: forzando cancelación por parametro cancelar=true (pre-update)', ['reserva_id' => $reserva->id, 'monto' => $monto]);
                $ultimoPago = $reserva->pagos()->orderByDesc('pagado_en')->first();
                if ($ultimoPago) {
                    $ultimoPago->update(['estado' => 'cancelado']);
                }
                $reserva->update(['pago' => 'devuelto', 'status' => 'cancelado']);
                \Illuminate\Support\Facades\Log::info('reembolsarReserva: reserva marcada como devuelto (post-update)', ['reserva_id' => $reserva->id]);
            } catch (\Throwable $e) {
                // No bloqueamos la respuesta principal si esto falla
                \Illuminate\Support\Facades\Log::warning('No se pudo forzar cancelación tras reembolso: ' . $e->getMessage());
            }
        }

        return response()->json($resultado, $status);
    }
}
