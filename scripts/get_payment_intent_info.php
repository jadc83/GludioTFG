<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Stripe\StripeClient;

$pi = $argv[1] ?? null;
if (! $pi) { echo "Usage: php scripts/get_payment_intent_info.php {payment_intent_id}\n"; exit(1); }

$stripe = new StripeClient(config('services.stripe.secret'));
try {
    $intent = $stripe->paymentIntents->retrieve($pi, []);
    echo json_encode($intent->toArray(), JSON_PRETTY_PRINT) . "\n";
} catch (\Throwable $e) {
    echo "Error retrieving PaymentIntent: " . $e->getMessage() . "\n";
}
