<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Models\Pago;
use App\Services\PaymentService;

$localizador = $argv[1] ?? null;
if (! $localizador) { echo "Usage: php scripts/test_webhook_checkout_session.php {localizador}\n"; exit(1); }

$reserva = Reserva::with(['pagos'])->where('localizador', $localizador)->first();
if (! $reserva) { echo "Reserva {$localizador} no encontrada\n"; exit(1); }

$pago = $reserva->pagos()->whereIn('estado', ['procesando', 'fallido'])->orderByDesc('created_at')->first();
if (! $pago) {
    echo "No hay pagos en estado 'procesando' o 'fallido' para la reserva {$localizador}.\n";
    // intentar usar cualquier pago
    $pago = $reserva->pagos()->orderByDesc('created_at')->first();
    if (! $pago) { echo "No hay pagos asociados a la reserva.\n"; exit(1); }
}

echo "--- Antes ---\n";
echo "Pago id={$pago->id} estado={$pago->estado} stripe_checkout_session_id={$pago->stripe_checkout_session_id} stripe_payment_intent_id={$pago->stripe_payment_intent_id}\n";
echo "Reserva pago field={$reserva->pago} precio_total={$reserva->precio_total}\n";

$sessionId = $pago->stripe_checkout_session_id ?? 'sess_fake_' . uniqid();
$paymentIntent = $pago->stripe_payment_intent_id ?? null;

$session = new stdClass();
$session->id = $sessionId;
$session->payment_intent = $paymentIntent;

$service = new PaymentService();

try {
    $service->handleCheckoutSessionCompleted($session);
    echo "Procesado handleCheckoutSessionCompleted para session={$session->id}\n";
} catch (\Throwable $e) {
    echo "Error procesando sesión: " . $e->getMessage() . "\n";
    exit(1);
}

$pagoFresh = Pago::find($pago->id);
$reservaFresh = Reserva::find($reserva->id);

echo "--- Después ---\n";
echo "Pago id={$pagoFresh->id} estado={$pagoFresh->estado} pagado_en={$pagoFresh->pagado_en}\n";
echo "Reserva pago field={$reservaFresh->pago}\n";

echo "Pago stripe_response snippet: " . json_encode(array_slice($pagoFresh->stripe_response ?? [], 0, 5), JSON_PRETTY_PRINT) . "\n";

exit(0);
