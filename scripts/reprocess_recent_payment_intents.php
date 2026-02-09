<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Stripe\StripeClient;
use App\Services\PaymentService;
use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Support\Facades\DB;

$limit = intval($argv[1] ?? 100);
$days = intval($argv[2] ?? 7);

$stripe = new StripeClient(config('services.stripe.secret'));
$ps = app(PaymentService::class);

echo "Listing up to {$limit} PaymentIntents succeeded from last {$days} days...\n";

$since = time() - ($days * 24 * 3600);

try {
    $resp = $stripe->paymentIntents->all(['limit' => $limit, 'created' => ['gte' => $since]]);
} catch (\Throwable $e) {
    echo "Error fetching PaymentIntents: " . $e->getMessage() . "\n";
    exit(1);
}

$processed = 0;
$created = 0;
$skipped = 0;

foreach ($resp->data as $pi) {
    $piId = is_object($pi) ? ($pi->id ?? null) : ($pi['id'] ?? null);
    if (!$piId) continue;
    echo "\nProcessing {$piId} (status=" . ($pi->status ?? 'n/a') . ")...\n";

    // Skip non-succeeded intents unless user wants all
    if (($pi->status ?? '') !== 'succeeded') {
        echo "  Skipping (status not succeeded)\n";
        $skipped++;
        continue;
    }

    // Check local mapping
    $exists = Pago::where('stripe_payment_intent_id', $piId)->exists() || Pago::where('stripe_response', 'like', "%{$piId}%")->exists();
    if ($exists) {
        echo "  Already mapped to a Pago.\n";
        $skipped++;
        continue;
    }

    // Try confirmarPaymentIntent (which may create Pago if metadata present)
    try {
        $resp = $ps->confirmarPaymentIntent($piId);
        if (!empty($resp['success'])) {
            echo "  Confirmed via PaymentService: ";
            echo json_encode($resp) . "\n";
            $processed++;
            continue;
        }
    } catch (\Throwable $e) {
        echo "  confirmarPaymentIntent error: " . $e->getMessage() . "\n";
    }

    // If still not mapped, create a Reserva placeholder + Pago
    try {
        DB::beginTransaction();

        $amount = null;
        if (isset($pi->amount_received)) $amount = ((int)$pi->amount_received) / 100.0;
        elseif (isset($pi->amount)) $amount = ((int)$pi->amount) / 100.0;

        $localizador = 'AUTO-PI-' . substr($piId, 3, 8) . '-' . time();
        $checkIn = date('Y-m-d');
        $checkOut = date('Y-m-d', strtotime('+1 day'));

        $reserva = Reserva::create([
            'localizador' => $localizador,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'precio_total' => $amount,
            'status' => 'confirmado',
            'pago' => 'pagado',
        ]);

        $pago = Pago::create([
            'reserva_id' => $reserva->id,
            'stripe_payment_intent_id' => $piId,
            'monto' => $amount ?? 0,
            'moneda' => $pi->currency ?? 'eur',
            'estado' => 'completado',
            'descripcion' => 'Pago creado automáticamente desde reprocess_recent_payment_intents',
            'stripe_response' => is_object($pi) && method_exists($pi, 'toArray') ? $pi->toArray() : (array)$pi,
        ]);

        DB::commit();
        echo "  Created Reserva id={$reserva->id} Pago id={$pago->id}\n";
        $created++;
    } catch (\Throwable $e) {
        DB::rollBack();
        echo "  Error creating placeholder: " . $e->getMessage() . "\n";
    }
}

echo "\nDone. Processed={$processed} Created={$created} Skipped={$skipped}\n";
exit(0);
