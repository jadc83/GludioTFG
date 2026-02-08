<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;
use Stripe\Stripe;
use Stripe\PaymentIntent;

$pagoId = $argv[1] ?? null;
if (! $pagoId) { echo "Usage: php scripts/inspect_pago.php {pago_id}\n"; exit(1); }

$pago = Pago::with('reserva')->find($pagoId);
if (! $pago) { echo "Pago {$pagoId} no encontrado\n"; exit(1); }

echo "Pago id={$pago->id} reserva_id={$pago->reserva_id} estado={$pago->estado}\n";
echo "stripe_payment_intent_id={$pago->stripe_payment_intent_id}\n";
echo "stripe_response (summary):\n";
if ($pago->stripe_response) {
    if (is_array($pago->stripe_response)) {
        echo json_encode(array_intersect_key($pago->stripe_response, array_flip(['id','status','amount','currency','last_payment_error','client_secret'])), JSON_PRETTY_PRINT) . "\n";
    } else {
        echo substr((string)$pago->stripe_response, 0, 1000) . "\n";
    }
} else {
    echo "(none)\n";
}

// Try to fetch from Stripe API if configured and id present
if (config('services.stripe.secret') && $pago->stripe_payment_intent_id) {
    Stripe::setApiKey(config('services.stripe.secret'));
    try {
        $pi = PaymentIntent::retrieve($pago->stripe_payment_intent_id);
        echo "Stripe PaymentIntent id={$pi->id} status={$pi->status} amount={$pi->amount} currency={$pi->currency}\n";
        if (isset($pi->client_secret)) {
            echo "client_secret: " . ($pi->client_secret ?? '[none]') . "\n";
        }
        if (isset($pi->last_payment_error) && $pi->last_payment_error) {
            echo "last_payment_error: " . json_encode($pi->last_payment_error) . "\n";
        }
    } catch (\Throwable $e) {
        echo "Error fetching PaymentIntent from Stripe: " . $e->getMessage() . "\n";
    }
} else {
    echo "Stripe not configured or no payment_intent_id available.\n";
}

exit(0);
