<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\PaymentService;

$pi = $argv[1] ?? null;
if (! $pi) { echo "Usage: php scripts/confirm_payment_intent.php {payment_intent_id}\n"; exit(1); }

$svc = new PaymentService();

// First try to find a Checkout Session that references this PaymentIntent so we can map it to a Pago
$stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
$sessionFound = null;
try {
    $sessions = $stripe->checkout->sessions->all(['payment_intent' => $pi, 'limit' => 3]);
    if (!empty($sessions->data) && count($sessions->data) > 0) {
        $sessionFound = $sessions->data[0];
        echo "Found checkout session referencing PI: " . ($sessionFound->id ?? 'n/a') . "\n";
    }
} catch (\Throwable $e) {
    echo "Error searching sessions: " . $e->getMessage() . "\n";
}

if ($sessionFound && ($sessionFound->id ?? null)) {
    $sessionId = $sessionFound->id;
    $pago = \App\Models\Pago::where('stripe_checkout_session_id', $sessionId)->first();
    if ($pago) {
        echo "Found Pago id={$pago->id} linked to session {$sessionId}. Will set stripe_payment_intent_id and confirm.\n";
        $pago->update(['stripe_payment_intent_id' => $pi]);
    } else {
        echo "No Pago found for session {$sessionId}\n";
    }
}

$resp = $svc->confirmarPaymentIntent($pi);

echo "Response: " . json_encode($resp, JSON_PRETTY_PRINT) . "\n";
