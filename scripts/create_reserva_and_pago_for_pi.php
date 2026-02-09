<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Models\Pago;
use Stripe\StripeClient;

$pi = $argv[1] ?? null;
if (! $pi) { echo "Usage: php scripts/create_reserva_and_pago_for_pi.php {payment_intent_id}\n"; exit(1); }

$stripe = new StripeClient(config('services.stripe.secret'));
try {
    $intent = $stripe->paymentIntents->retrieve($pi, ['expand' => ['charges.data']]);
} catch (\Throwable $e) {
    echo "Error retrieving PaymentIntent: " . $e->getMessage() . "\n";
    exit(1);
}

$amount = null;
try {
    if (isset($intent->amount_received)) $amount = ((int)$intent->amount_received) / 100.0;
    elseif (isset($intent->amount)) $amount = ((int)$intent->amount) / 100.0;
} catch (\Throwable $_e) { $amount = 0; }

$localizador = 'AUTO-PI-' . substr($pi, 3, 8) . '-' . time();
$checkIn = date('Y-m-d');
$checkOut = date('Y-m-d', strtotime('+1 day'));

try {
    // Crear reserva placeholder
    $reserva = Reserva::create([
        'localizador' => $localizador,
        'check_in' => $checkIn,
        'check_out' => $checkOut,
        'precio_total' => $amount,
        'status' => 'confirmado',
        'pago' => ($intent->status === 'succeeded') ? 'pagado' : 'pendiente',
    ]);

    // Crear pago vinculado
    $pago = Pago::create([
        'reserva_id' => $reserva->id,
        'stripe_payment_intent_id' => $pi,
        'monto' => $amount ?? 0,
        'moneda' => $intent->currency ?? 'eur',
        'estado' => ($intent->status === 'succeeded') ? 'completado' : 'procesando',
        'descripcion' => 'Pago creado y vinculado automáticamente desde PaymentIntent standalone',
        'stripe_response' => is_object($intent) && method_exists($intent, 'toArray') ? $intent->toArray() : (array)$intent,
    ]);

    echo "Created Reserva id={$reserva->id} localizador={$reserva->localizador}\n";
    echo "Created Pago id={$pago->id} reserva_id={$pago->reserva_id} monto={$pago->monto} estado={$pago->estado}\n";
    exit(0);
} catch (\Throwable $e) {
    echo "Error creating reserva/pago: " . $e->getMessage() . "\n";
    exit(1);
}
