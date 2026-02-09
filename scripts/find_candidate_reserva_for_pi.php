<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use Stripe\StripeClient;

$pi = $argv[1] ?? null;
if (! $pi) { echo "Usage: php scripts/find_candidate_reserva_for_pi.php {payment_intent_id}\n"; exit(1); }

$stripe = new StripeClient(config('services.stripe.secret'));
try {
    $intent = $stripe->paymentIntents->retrieve($pi, []);
} catch (\Throwable $e) {
    echo "Error retrieving PaymentIntent: " . $e->getMessage() . "\n";
    exit(1);
}

$amount = null;
try {
    if (isset($intent->amount_received)) $amount = ((int)$intent->amount_received) / 100.0;
    elseif (isset($intent->amount)) $amount = ((int)$intent->amount) / 100.0;
} catch (\Throwable $_e) { $amount = null; }

$createdTs = $intent->created ?? null;
$from = null; $to = null;
if ($createdTs) {
    $from = date('Y-m-d H:i:s', max(0, $createdTs - 86400));
    $to = date('Y-m-d H:i:s', $createdTs + 86400);
}

echo "Searching reservas near amount={$amount} and created between {$from} and {$to}\n";

$query = Reserva::query();
if ($amount !== null) {
    $delta = 20; // +/- 20 euros
    $query->whereBetween('precio_total', [$amount - $delta, $amount + $delta]);
}
if ($from && $to) {
    $query->whereBetween('created_at', [$from, $to]);
}

$candidates = $query->with('pagos')->orderByDesc('created_at')->limit(20)->get();
if ($candidates->isEmpty()) { echo "No candidate reservas found.\n"; exit(0); }

foreach ($candidates as $r) {
    echo "Reserva id={$r->id} localizador={$r->localizador} precio_total={$r->precio_total} created_at={$r->created_at} pagos_count={$r->pagos->count()} pago_flag={$r->pago}\n";
    foreach ($r->pagos as $p) {
        echo "  - Pago id={$p->id} monto={$p->monto} estado={$p->estado} pi={$p->stripe_payment_intent_id}\n";
    }
}

exit(0);
