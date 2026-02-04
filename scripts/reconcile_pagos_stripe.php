<?php
// Script: scripts/reconcile_pagos_stripe.php
// Usage: php scripts/reconcile_pagos_stripe.php [--dry-run]

require __DIR__ . '/../vendor/autoload.php';

// Bootstrap the framework
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Log;

$dryRun = in_array('--dry-run', $argv, true);

/** @var PaymentService $ps */
$ps = app(PaymentService::class);

$pagos = Pago::whereNotNull('stripe_payment_intent_id')
    ->whereNotIn('estado', ['completado', 'pagado'])
    ->orderBy('id')
    ->get();

if ($pagos->isEmpty()) {
    echo "No hay pagos pendientes de reconciliación.\n";
    exit(0);
}

foreach ($pagos as $pago) {
    echo sprintf("Procesando Pago id=%d reserva_id=%d intent=%s estado=%s\n", $pago->id, $pago->reserva_id, $pago->stripe_payment_intent_id, $pago->estado);

    if ($dryRun) {
        continue;
    }

    try {
        $resp = $ps->confirmarPaymentIntent($pago->stripe_payment_intent_id, $pago);
        echo sprintf("  -> resultado: success=%s status=%s pago_id=%s\n", ($resp['success'] ?? false) ? 'true' : 'false', $resp['status'] ?? 'n/a', $resp['pago_id'] ?? 'n/a');
    } catch (\Throwable $e) {
        echo "  -> error: " . $e->getMessage() . "\n";
        Log::error('reconcile_pagos_stripe error processing pago ' . $pago->id . ': ' . $e->getMessage());
    }
}

echo "Reconciliación finalizada.\n";
