<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Stripe\StripeClient;

$localizador = $argv[1] ?? null;
if (! $localizador) { echo "Usage: php scripts/find_payment_intent_by_localizador.php <localizador>\n"; exit(1); }

$stripeSecret = config('services.stripe.secret');
if (empty($stripeSecret)) {
    echo "Stripe secret not configured (services.stripe.secret).\n";
    exit(1);
}

$stripe = new StripeClient($stripeSecret);
try {
    $search = $stripe->paymentIntents->search(['query' => "metadata['localizador']:'{$localizador}'", 'limit' => 5]);
    if (empty($search->data)) {
        echo "No PaymentIntents found for localizador {$localizador}\n";
    } else {
        foreach ($search->data as $pi) {
            echo "Found: id={$pi->id} status={$pi->status} amount={$pi->amount} currency={$pi->currency}\n";
        }
    }
} catch (\Throwable $e) {
    echo "Stripe API error: " . $e->getMessage() . "\n";
}

exit(0);
