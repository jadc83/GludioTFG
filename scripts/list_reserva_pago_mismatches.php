<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Models\Pago;

$reservas = Reserva::with(['pagos'])->orderBy('id')->get();

$mismatches_completed_but_reserva_not_pagado = [];
$mismatches_reserva_pagado_but_no_completed_pago = [];
$summary = [];

foreach ($reservas as $r) {
    $lastPago = $r->pagos->sortBy('created_at')->last();
    $lastEstado = $lastPago?->estado ?? null;
    $lastMonto = $lastPago?->monto ?? null;
    $anyCompleted = $r->pagos->contains(function($p) { return in_array($p->estado, ['completado','pagado']); });

    $summary[] = [
        'localizador' => $r->localizador,
        'reserva_pago' => $r->pago,
        'ultimo_pago_estado' => $lastEstado,
        'ultimo_pago_monto' => $lastMonto,
        'pagos_count' => $r->pagos->count(),
        'pago_ids' => $r->pagos->pluck('id')->toArray(),
    ];

    if ($anyCompleted && strtolower($r->pago) !== 'pagado') {
        $mismatches_completed_but_reserva_not_pagado[] = [
            'localizador' => $r->localizador,
            'reserva_pago' => $r->pago,
            'ultimo_pago_estado' => $lastEstado,
            'ultimo_pago_monto' => $lastMonto,
            'pagos_count' => $r->pagos->count(),
            'pago_ids' => $r->pagos->pluck('id')->toArray(),
        ];
    }

    if (!$anyCompleted && strtolower($r->pago) === 'pagado') {
        $mismatches_reserva_pagado_but_no_completed_pago[] = [
            'localizador' => $r->localizador,
            'reserva_pago' => $r->pago,
            'ultimo_pago_estado' => $lastEstado,
            'ultimo_pago_monto' => $lastMonto,
            'pagos_count' => $r->pagos->count(),
            'pago_ids' => $r->pagos->pluck('id')->toArray(),
        ];
    }
}

$output = [
    'total_reservas' => count($reservas),
    'mismatch_completed_but_reserva_not_pagado_count' => count($mismatches_completed_but_reserva_not_pagado),
    'mismatch_reserva_pagado_but_no_completed_pago_count' => count($mismatches_reserva_pagado_but_no_completed_pago),
    'mismatches_completed_but_reserva_not_pagado' => $mismatches_completed_but_reserva_not_pagado,
    'mismatches_reserva_pagado_but_no_completed_pago' => $mismatches_reserva_pagado_but_no_completed_pago,
    //'summary' => $summary,
];

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
