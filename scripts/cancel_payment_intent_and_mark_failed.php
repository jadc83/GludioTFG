<?php
// Uso: php scripts/cancel_payment_intent_and_mark_failed.php <pago_id>
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;
use Illuminate\Support\Facades\Log;

$pagoId = $argv[1] ?? null;
if (! $pagoId) { echo "Usage: php scripts/cancel_payment_intent_and_mark_failed.php <pago_id>\n"; exit(1); }

$pago = Pago::find((int)$pagoId);
if (! $pago) { echo "Pago {$pagoId} not found\n"; exit(1); }

$pi = $pago->stripe_payment_intent_id ?? null;
if (! $pi) { echo "Pago {$pagoId} has no stripe_payment_intent_id\n"; exit(1); }

try {
    // Use Stripe client directly to avoid protected accessor
    $stripeSecret = config('services.stripe.secret') ?? getenv('STRIPE_SECRET');
    if (! $stripeSecret) {
        throw new \Exception('Stripe secret key not configured');
    }
    $stripe = new \Stripe\StripeClient($stripeSecret);

    echo "Retrieving PaymentIntent: {$pi}\n";
    $intent = $stripe->paymentIntents->retrieve($pi, []);
    $status = $intent->status ?? null;
    echo "Status: " . ($status ?? 'unknown') . "\n";

    if ($status === 'succeeded') {
        echo "PaymentIntent already succeeded; not cancelling. Consider keeping Pago as completed.\n";
        exit(0);
    }

    if ($status === 'canceled') {
        echo "PaymentIntent already canceled. Marking Pago as fallido if not already.\n";
    } else {
        echo "Cancelling PaymentIntent {$pi}...\n";
        $cancelResult = $stripe->paymentIntents->cancel($pi, []);
        echo "Cancel result status: " . ($cancelResult->status ?? 'unknown') . "\n";
        $intent = $cancelResult;
    }

    // Update Pago record as fallido
    $pago->estado = 'fallido';
    $stripeResp = $pago->stripe_response ?? [];
    // merge with latest intent array representation
    try { $stripeResp = array_merge(is_array($stripeResp) ? $stripeResp : (array)$stripeResp, (array)$intent); } catch (\Throwable $e) { $stripeResp = (array)$intent; }
    $pago->stripe_response = $stripeResp;
    $pago->save();

    echo "Pago {$pagoId} marked as fallido and stripe_response updated.\n";
    exit(0);
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
