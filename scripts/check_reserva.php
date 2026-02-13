<?php
// scripts/check_reserva.php
// Usage: php scripts/check_reserva.php LOCALIZADOR

if ($argc < 2) {
    echo "Usage: php scripts/check_reserva.php LOCALIZADOR\n";
    exit(1);
}
$localizador = $argv[1];

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;

try {
    $r = Reserva::where('localizador', $localizador)
        ->with(['pagos', 'reembolsos', 'refundRequests'])
        ->first();

    if (! $r) {
        echo "NOT_FOUND\n";
        exit(0);
    }

    $out = [
        'id' => $r->id,
        'localizador' => $r->localizador,
        'status' => $r->status,
        'pago_field' => $r->pago,
        'pagos' => [],
        'refunds' => [],
        'refundRequests' => [],
    ];

    foreach ($r->pagos as $p) {
        $out['pagos'][] = [
            'id' => $p->id,
            'monto' => (float) $p->monto,
            'estado' => $p->estado,
            'reembolso_estado' => $p->reembolso_estado ?? null,
            'pagado_en' => $p->pagado_en ? $p->pagado_en->toDateTimeString() : null,
        ];
    }

    foreach ($r->reembolsos as $f) {
        $out['refunds'][] = [
            'id' => $f->id,
            'amount' => ($f->amount_cents / 100),
            'status' => $f->status,
            'stripe_id' => $f->stripe_refund_id,
            'created_at' => $f->created_at ? $f->created_at->toDateTimeString() : null,
        ];
    }

    foreach ($r->refundRequests as $rr) {
        $out['refundRequests'][] = [
            'id' => $rr->id,
            'status' => $rr->status,
            'requested_amount' => $rr->requested_amount_cents ? ($rr->requested_amount_cents/100) : null,
            'processed_refund_amount' => $rr->processed_refund_amount_cents ? ($rr->processed_refund_amount_cents/100) : null,
            'processed_at' => $rr->processed_at ? $rr->processed_at->toDateTimeString() : null,
        ];
    }

    echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
