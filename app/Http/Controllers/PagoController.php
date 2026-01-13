<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Illuminate\Support\Facades\Log;

class PagoController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Crear un PaymentIntent para la reserva
     */
    public function crearPaymentIntent(Request $request)
    {
        $validated = $request->validate([
            'reserva_id' => 'required|integer|exists:reservas,id',
            'monto' => 'required|numeric|min:0.01',
        ]);

        try {
            // Verificar que la clave secreta de Stripe está configurada
            if (!config('services.stripe.secret')) {
                throw new \Exception('STRIPE_SECRET_KEY no está configurada en .env');
            }

            $reserva = Reserva::findOrFail($validated['reserva_id']);

            // Crear PaymentIntent en Stripe
            $paymentIntent = PaymentIntent::create([
                'amount' => (int)round($validated['monto'] * 100), // Stripe usa centavos
                'currency' => 'eur',
                'metadata' => [
                    'reserva_id' => $reserva->id,
                    'localizador' => $reserva->localizador,
                ],
                'description' => "Pago de reserva {$reserva->localizador}",
            ]);

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

            return response()->json([
                'success' => true,
                'clientSecret' => $paymentIntent->client_secret,
                'pago_id' => $pago->id,
                'reserva_id' => $reserva->id,
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

                return response()->json([
                    'success' => true,
                    'message' => 'Pago completado exitosamente',
                    'reserva_id' => $pago->reserva_id,
                    'localizador' => $pago->reserva->localizador,
                ]);
            } else {
                $pago->marcarComoFallido();

                return response()->json([
                    'success' => false,
                    'message' => 'El pago no se pudo procesar',
                ], 400);
            }
        } catch (\Exception $e) {
            $pago->marcarComoFallido();
            Log::error('Confirmar Pago Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'No se pudo confirmar el pago. Por favor, intenta nuevamente.',
            ], 400);
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
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpointSecret
            );

            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent = $event->data->object;

                $pago = Pago::where('stripe_payment_intent_id', $paymentIntent->id)->first();
                if ($pago) {
                    $pago->marcarComoPagado();
                    $pago->reserva->update(['pago' => 'pagado']);
                }
            } elseif ($event->type === 'payment_intent.payment_failed') {
                $paymentIntent = $event->data->object;

                $pago = Pago::where('stripe_payment_intent_id', $paymentIntent->id)->first();
                if ($pago) {
                    $pago->marcarComoFallido();
                }
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
