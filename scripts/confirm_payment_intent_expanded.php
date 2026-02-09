<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\PaymentService;
use Stripe\StripeClient;

$pi = $argv[1] ?? null;
if (! $pi) { echo "Usage: php scripts/confirm_payment_intent_expanded.php {payment_intent_id}\n"; exit(1); }

$svc = new PaymentService();
$stripe = new StripeClient(config('services.stripe.secret'));

try {
    $intent = $stripe->paymentIntents->retrieve($pi, ['expand' => ['charges.data.billing_details', 'charges.data.payment_method_details']]);
    echo "Retrieved expanded PaymentIntent: " . ($intent->id ?? $pi) . "\n";
} catch (\Throwable $e) {
    echo "Error retrieving expanded PaymentIntent: " . $e->getMessage() . "\n";
    exit(1);
}

// Pass the full object to the service so it can use charges.billing_details for heuristics
$resp = $svc->confirmarPaymentIntent($intent);

echo "Response: " . json_encode($resp, JSON_PRETTY_PRINT) . "\n";

if (!empty($intent->charges->data) && count($intent->charges->data) > 0) {
    $ch = $intent->charges->data[0];
    $billing = $ch->billing_details ?? null;
    echo "Charge billing details: " . json_encode($billing, JSON_PRETTY_PRINT) . "\n";
}

exit(0);
