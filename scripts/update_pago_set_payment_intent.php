<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;

$pagoId = $argv[1] ?? null;
$paymentIntent = $argv[2] ?? null;

if (! $pagoId || ! $paymentIntent) {
    echo "Usage: php scripts/update_pago_set_payment_intent.php {pago_id} {payment_intent_id}\n";
    exit(1);
}

$pago = Pago::find($pagoId);
if (! $pago) {
    echo "Pago id={$pagoId} no encontrado\n";
    exit(1);
}

$pago->stripe_payment_intent_id = $paymentIntent;

// If stripe_response exists and contains a checkout session with payment_intent, try to sync minimal fields
try {
    $sr = $pago->stripe_response;
    if (is_array($sr)) {
        if (isset($sr['checkout_session']) && isset($sr['checkout_session']['payment_intent'])) {
            $sr['checkout_session']['payment_intent'] = $paymentIntent;
        }
        if (! isset($sr['payment_intent'])) {
            $sr['payment_intent'] = ['id' => $paymentIntent];
        } else {
            if (is_array($sr['payment_intent'])) { $sr['payment_intent']['id'] = $paymentIntent; }
        }
        $pago->stripe_response = $sr;
    }
} catch (Exception $e) {
    // ignore any json issues
}

$pago->save();

echo "Pago id={$pago->id} actualizado con stripe_payment_intent_id={$paymentIntent}\n";
exit(0);
