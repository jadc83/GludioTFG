<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;
use Stripe\StripeClient;

$pi = $argv[1] ?? null;
if (! $pi) { echo "Usage: php scripts/create_pago_from_pi.php {payment_intent_id}\n"; exit(1); }

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

$pago = Pago::create([
    'reserva_id' => null,
    'stripe_payment_intent_id' => $pi,
    'monto' => $amount ?? 0,
    'moneda' => $intent->currency ?? 'eur',
    'estado' => ($intent->status === 'succeeded') ? 'completado' : 'procesando',
    'descripcion' => 'Pago creado manual desde script (fallback para PI sin metadata)',
    'stripe_response' => is_object($intent) && method_exists($intent, 'toArray') ? $intent->toArray() : (array)$intent,
]);

echo "Created Pago id={$pago->id} for PaymentIntent {$pi} (monto={$pago->monto} {$pago->moneda})\n";
exit(0);
