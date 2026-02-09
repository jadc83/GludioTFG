<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Events\ReservaActualizada;
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
            if (!config('services.stripe.secret')) {
                throw new \Exception('STRIPE_SECRET_KEY no está configurada en .env');
            }

            $reserva = Reserva::find($validated['reserva_id']);

            // Delegar la creación del PaymentIntent al servicio
            $serviceResp = $this->paymentService->crearPaymentIntentParaReserva($reserva, (float)$validated['monto'], [
                'subtotal_habitaciones' => $validated['subtotal_habitaciones'] ?? null,
                'precioTarifas' => $validated['precioTarifas'] ?? null,
                'receipt_email' => $reserva->reservable?->email ?? $request->input('email') ?? null,
                'confirm_with_pm' => $request->boolean('confirm_with_pm') ?? false,
            ]);

            if (!empty($serviceResp['success'])) {
                return response()->json([
                    'success' => true,
                    'clientSecret' => $serviceResp['clientSecret'] ?? null,
                    'pago_id' => $serviceResp['pago_id'] ?? null,
                    'reserva_id' => $reserva->id,
                    'paymentIntentId' => $serviceResp['paymentIntentId'] ?? null,
                    'paymentIntentStatus' => $serviceResp['paymentIntentStatus'] ?? null,
                ]);
            }

            return response()->json(['success' => false, 'error' => $serviceResp['error'] ?? 'Error creando payment intent'], 400);

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
     * Crear un PaymentIntent standalone (sin reserva asociada)
     */
    public function crearPaymentIntentStandalone(Request $request)
    {
        $validated = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'receipt_email' => 'nullable|email',
            'metadata' => 'nullable|array',
            'metadata.reserva_id' => 'nullable|integer|exists:reservas,id',
            'reserva_id' => 'nullable|integer|exists:reservas,id',
            // Permitir flag explícito para flujos que crean PI antes de la reserva
            'allow_without_metadata' => 'nullable|boolean',
        ]);

        try {
            // Normalizar metadata: si se envía reserva_id en top-level, colocarlo dentro de metadata
            $metadata = $request->input('metadata', []);
            if ($request->filled('reserva_id')) {
                $metadata['reserva_id'] = $request->input('reserva_id');
            }

            $serviceResp = $this->paymentService->crearPaymentIntentStandalone((float)$validated['monto'], [
                'receipt_email' => $validated['receipt_email'] ?? null,
                'metadata' => $metadata,
                'allow_without_metadata' => !empty($validated['allow_without_metadata']),
            ]);

            if (!empty($serviceResp['success'])) {
                return response()->json([
                    'success' => true,
                    'clientSecret' => $serviceResp['clientSecret'] ?? null,
                    'paymentIntentId' => $serviceResp['paymentIntentId'] ?? null,
                    'paymentIntentStatus' => $serviceResp['paymentIntentStatus'] ?? null,
                ]);
            }

            return response()->json(['success' => false, 'error' => $serviceResp['error'] ?? 'Error creating payment intent'], 400);
        } catch (\Exception $e) {
            Log::error('crearPaymentIntentStandalone error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error creando PaymentIntent'], 400);
        }
    }

    public function crearCheckoutSession(Request $request)
    {
        $validated = $request->validate([
            'reserva_id' => 'required|integer|exists:reservas,id',
            'monto' => 'required|numeric|min:0.01',
        ]);

        try {

            $reserva = Reserva::findOrFail($validated['reserva_id']);
            // Delegar creación de checkout al servicio (usa success_url = home por defecto)
            $checkout = $this->paymentService->crearCheckoutSessionParaReserva($reserva, (float)$validated['monto']);

            if (!empty($checkout['success'])) {
                try {
                    \Illuminate\Support\Facades\Log::info('Checkout creado (controller)', ['reserva' => $reserva->localizador, 'resp' => $checkout]);
                } catch (\Throwable $e) { /* noop */ }

                return response()->json([
                    'success' => true,
                    'sessionId' => $checkout['sessionId'] ?? null,
                    'sessionUrl' => $checkout['sessionUrl'] ?? null,
                    'publicKey' => config('services.stripe.public'),
                ]);
            }

            return response()->json(['success' => false, 'error' => $checkout['error'] ?? 'Error creating checkout session'], 400);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API Error creating checkout session: ' . $e->getMessage());
            Log::error('Stripe checkout exception (full)', ['exception' => $e]);
            $msg = (app()->isLocal() || config('app.debug')) ? $e->getMessage() : 'Error creating checkout session';
            return response()->json(['success' => false, 'error' => $msg], 400);
        } catch (\Exception $e) {
            Log::error('Error creating checkout session: ' . $e->getMessage());
            Log::error('CheckoutSession exception (full)', ['exception' => $e]);
            $msg = (app()->isLocal() || config('app.debug')) ? $e->getMessage() : 'Error creating checkout session';
            return response()->json(['success' => false, 'error' => $msg], 400);
        }
    }

    public function confirmarPago(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'pago_id' => 'nullable|exists:pagos,id',
        ]);

        $pago = null;
        if ($request->filled('pago_id')) {
            $pago = Pago::find($request->pago_id);
        }

        try {
            Log::info('confirmarPago called', ['payment_intent_id' => $request->input('payment_intent_id'), 'pago_id' => $request->input('pago_id')]);

            $resp = $this->paymentService->confirmarPaymentIntent($request->payment_intent_id, $pago);

            // Registrar la respuesta del servicio para depuración
            try { Log::info('confirmarPago: paymentService response', ['resp' => $resp]); } catch (\Throwable $_e) { }

            // Si no tenemos un Pago en el controlador, intentar buscarlo localmente como fallback
            if (!$pago) {
                try {
                    $pago = Pago::where('stripe_payment_intent_id', $request->payment_intent_id)->first()
                        ?? Pago::where('stripe_response', 'like', '%' . $request->payment_intent_id . '%')->first();
                    if ($pago) {
                        Log::info('confirmarPago: Pago recuperado mediante fallback DB', ['pago_id' => $pago->id, 'payment_intent_id' => $request->payment_intent_id]);
                    }
                } catch (\Throwable $_e) {
                    Log::warning('confirmarPago: fallo en fallback DB buscando Pago: ' . $_e->getMessage());
                }
            }

            // Si el servicio indica éxito pero seguimos sin Pago, pedir al servicio que reprocese como si fuera webhook
            if (empty($pago) && !empty($resp) && empty($resp['success']) ) {
                try {
                    // Reintentar procesar el payment_intent en el servicio (idempotente)
                    $this->paymentService->handlePaymentIntentSucceeded($request->payment_intent_id);
                    // reintentar recuperar Pago
                    $pago = Pago::where('stripe_payment_intent_id', $request->payment_intent_id)->first()
                        ?? Pago::where('stripe_response', 'like', '%' . $request->payment_intent_id . '%')->first();
                    if ($pago) Log::info('confirmarPago: Pago encontrado tras reintentar handlePaymentIntentSucceeded', ['pago_id' => $pago->id]);
                } catch (\Throwable $_e) {
                    Log::warning('confirmarPago: error al reintentar handlePaymentIntentSucceeded: ' . $_e->getMessage());
                }
            }

            if (!empty($resp['success']) && ($resp['status'] ?? '') === 'succeeded') {
                // Si el controlador no recibió un Pago pero el servicio devolvió pago_id, cargarlo
                if (!$pago && !empty($resp['pago_id'])) {
                    try { $pago = Pago::find((int)$resp['pago_id']); } catch (\Throwable $_e) { $pago = null; }
                }

                if (!$pago) {
                    Log::warning('confirmarPago: pago no disponible tras confirmarPaymentIntent', ['payment_intent_id' => $request->payment_intent_id, 'resp' => $resp]);
                    return response()->json([ 'success' => false, 'message' => 'Pago no encontrado tras confirmación' ], 400);
                }

                try {
                    $pago->marcarComoPagado();
                } catch (\Throwable $e) {
                    Log::warning('confirmarPago: fallo al marcarPago como pagado: ' . $e->getMessage());
                }

                try { $pago->reserva->update(['pago' => 'pagado']); } catch (\Throwable $_e) { /* noop */ }

                // Enviar notificación centralizada (evitar duplicados con idempotencia)
                try {
                    $reserva = $pago->reserva->fresh(['reservable', 'pagos']);
                    $cambioReserva = $reserva->reservable;

                    // Comprueba si ya existe una notificación de pago para este pago
                    // Some DBs store `notifications.data` as text; cast to JSON for Postgres compatibility
                    $existsQuery = "(data::json->>'pago_id')::int = ?";
                    $exists = \Illuminate\Support\Facades\DB::table('notifications')
                        ->where('type', '\\App\\Notifications\\PagoConfirmadoNotification')
                        ->whereRaw($existsQuery, [$pago->id])
                        ->exists();

                    if (! $exists) {
                        if ($cambioReserva && method_exists($cambioReserva, 'notify')) {
                            $cambioReserva->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
                        } else {
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
                // Servicio ya marcó el pago como fallido si procedía. Responder con estado del servicio.
                return response()->json([ 'success' => false, 'message' => 'El pago no se pudo procesar', 'status' => $resp['status'] ?? null ], 400);
            }
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API error confirming payment: ' . $e->getMessage(), ['exception' => $e]);
            if ($pago) try { $pago->marcarComoFallido(); } catch (\Throwable $_e) { /* noop */ }
            return response()->json([ 'success' => false, 'error' => 'Error al confirmar el pago (Stripe API).'], 400);
        } catch (\Exception $e) {
            if ($pago) try { $pago->marcarComoFallido(); } catch (\Throwable $_e) { /* noop */ }
            Log::error('Confirmar Pago Error: ' . $e->getMessage());

            return response()->json([ 'success' => false, 'error' => 'No se pudo confirmar el pago. Por favor, intenta nuevamente.' ], 400);
        }
    }

    /**
     * Webhook de Stripe
     */
    public function webhook(Request $request)
    {
        $endpointSecret = config('services.stripe.webhook.secret');

        if (! $endpointSecret) {
            \Illuminate\Support\Facades\Log::warning('Stripe webhook secret not configured: services.stripe.webhook.secret is empty');
        }

        $payload = @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? null;

        try {
            $event = \Stripe\Webhook::constructEvent( $payload, $sig_header, $endpointSecret );
            \Illuminate\Support\Facades\Log::info('Stripe webhook received', ['type' => $event->type, 'id' => $event->id ?? null]);

            // Delegar algunos eventos al servicio y responder pronto para evitar re-entrega por tiempos largos
            if ($event->type === 'payment_intent.succeeded') {
                try {
                    $this->paymentService->handlePaymentIntentSucceeded($event->data->object);
                } catch (\Throwable $e) {
                    Log::error('Error delegando payment_intent.succeeded al servicio: ' . $e->getMessage());
                }
                return response()->json(['success' => true]);
            }

            if ($event->type === 'checkout.session.completed') {
                $session = $event->data->object;
                try {
                    $this->paymentService->handleCheckoutSessionCompleted($session);
                } catch (\Throwable $e) {
                    Log::error('Error delegating checkout session completed to PaymentService: ' . $e->getMessage());
                }
            } elseif ($event->type === 'payment_intent.payment_failed') {
                $paymentIntent = $event->data->object;
                try {
                    $this->paymentService->handlePaymentIntentFailed($paymentIntent);
                } catch (\Throwable $e) {
                    Log::error('Error delegando payment_intent.payment_failed al servicio: ' . $e->getMessage());
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

    public function marcarComoPagado(Request $request, Pago $pago)
    {
        try {
            $pago->marcarComoPagado();
            $pago->reserva->update(['pago' => 'pagado']);

            // Emitir evento para que el frontend actualice inmediatamente
            try {
                event(new ReservaActualizada($pago->reserva->fresh(['reservable', 'pagos']), null));
            } catch (\Throwable $e) {
                Log::warning('No se pudo emitir evento ReservaActualizada en marcarComoPagado: ' . $e->getMessage());
            }

            // Notificar de manera idempotente
            try {
                $reserva = $pago->reserva->fresh(['reservable', 'pagos']);
                $notifiable = $reserva->reservable;
            } catch (\Throwable $e) {
                Log::warning('No se pudo cargar reserva para notificar en marcarComoPagado: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'localizador' => $pago->reserva->localizador, 'reserva_id' => $pago->reserva_id, 'pago_id' => $pago->id]);
        } catch (\Throwable $e) {
            Log::error('Error marking pago as paid: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Endpoint: GET /pagos/check-session?session_id={CHECKOUT_SESSION_ID}
     * Comprueba el estado de la sesión en Stripe y confirma el PaymentIntent si procede.
     */
    public function checkSession(Request $request)
    {
        $request->validate(['session_id' => 'required|string']);
        $sessionId = $request->query('session_id');

        try {
            \Illuminate\Support\Facades\Log::info('checkSession called', ['session_id' => $sessionId, 'ip' => $request->ip()]);
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
            $session = $stripe->checkout->sessions->retrieve($sessionId, ['expand' => ['payment_intent']]);

            \Illuminate\Support\Facades\Log::info('Stripe session retrieved in checkSession', [
                'id' => $session->id ?? null,
                'payment_status' => $session->payment_status ?? null,
                'status' => $session->status ?? null,
                'payment_intent' => $session->payment_intent ?? null,
                'amount_total' => $session->amount_total ?? null,
                'currency' => $session->currency ?? null,
            ]);

            if (! $session) {
                return response()->json(['success' => false, 'error' => 'Session not found'], 404);
            }

            $paymentIntentId = $session->payment_intent ?? ($session->payment_intent??null);
            $paymentStatus = $session->payment_status ?? null;
            $status = $session->status ?? null;

            // If there's a PaymentIntent, try to confirm it via service (idempotent)
            if ($paymentIntentId) {
                $resp = $this->paymentService->confirmarPaymentIntent($paymentIntentId);
                return response()->json(['success' => true, 'paid' => ($resp['status'] ?? '') === 'succeeded', 'status' => $resp['status'] ?? null, 'pago_id' => $resp['pago_id'] ?? null]);
            }

            // If session indicates paid or session is complete, process as checkout completed
            if ($paymentStatus === 'paid' || $status !== 'open') {
                try {
                    $this->paymentService->handleCheckoutSessionCompleted($session);
                } catch (\Throwable $e) {
                    Log::warning('Error processing checkout session in checkSession: ' . $e->getMessage());
                }

                // Try to find a related Pago
                $pago = Pago::where('stripe_checkout_session_id', $sessionId)->first();
                $isPaid = $pago ? in_array($pago->estado, ['completado', 'pagado']) : true;

                return response()->json(['success' => true, 'paid' => $isPaid, 'status' => $paymentStatus ?? $status, 'pago_id' => $pago->id ?? null]);
            }

            return response()->json(['success' => true, 'paid' => false, 'status' => $paymentStatus ?? $status]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API error checking session: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Stripe API error'], 500);
        } catch (\Throwable $e) {
            Log::error('Error in checkSession: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }


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
        // reembolso correcto reserva cancelada
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
                \Illuminate\Support\Facades\Log::warning('No se pudo forzar cancelación tras reembolso: ' . $e->getMessage());
            }
        }

        return response()->json($resultado, $status);
    }
}
