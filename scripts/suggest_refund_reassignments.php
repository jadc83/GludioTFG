<?php
// Uso: php scripts/suggest_refund_reassignments.php [reserva_id|localizador] [--csv=path]
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RefundRequest;
use App\Models\Refund;
use App\Models\Pago;
use App\Models\Reserva;

$arg = $argv[1] ?? null;
$csvPath = null;
foreach ($argv as $a) {
    if (strpos($a, '--csv=') === 0) {
        $csvPath = substr($a, 6);
    }
}

$reserva = null;
if ($arg) {
    $reserva = is_numeric($arg) ? Reserva::find((int)$arg) : Reserva::where('localizador', $arg)->first();
    if (! $reserva) {
        echo "Reserva not found: {$arg}\n";
        exit(1);
    }
}

$query = RefundRequest::query()->whereIn('status', ['pending', 'processed']);
if ($reserva) $query->where('reserva_id', $reserva->id);
$requests = $query->with(['reserva','pago'])->orderBy('id')->get();

if ($requests->isEmpty()) {
    echo "No refund requests (pending/processed) found" . ($reserva ? " for reserva {$reserva->localizador} (id={$reserva->id})" : '') . "\n";
    exit(0);
}

$suggestions = [];
foreach ($requests as $rr) {
    $reqAmt = (int)($rr->requested_amount_cents ?? 0);
    $res = $rr->reserva;
    $pago = $rr->pago;

    $info = [
        'refund_request_id' => $rr->id,
        'reserva_id' => $rr->reserva_id,
        'localizador' => $res? $res->localizador : null,
        'requested_amount_cents' => $reqAmt,
        'current_payment_id' => $pago? $pago->id : null,
        'current_payment_available_cents' => null,
        'allocations' => [],
        'remaining_cents' => $reqAmt,
        'pending_payments' => [],
        'recommendation' => '',
    ];

    if (! $pago) {
        $info['recommendation'] = 'No pago asociado: revisar manualmente o asignar a un pago con saldo.';
        $suggestions[] = $info;
        continue;
    }

    $pagoMontoCents = (int)round(($pago->monto ?? 0) * 100);
    $alreadyRefunded = (int)Refund::where('pago_id', $pago->id)->sum('amount_cents');
    $available = $pagoMontoCents - $alreadyRefunded;
    $info['current_payment_available_cents'] = $available;

    if ($available >= $reqAmt) {
        $info['allocations'][] = ['pago_id' => $pago->id, 'amount_cents' => $reqAmt];
        $info['remaining_cents'] = 0;
        $info['recommendation'] = 'Suficiente saldo en el pago referenciado: procesar refund contra este pago.';
        $suggestions[] = $info;
        continue;
    }

    // Greedy allocation across completed payments (excluding the referenced one which we've already accounted)
    $remaining = $reqAmt;
    // Try to take whatever possible from the referenced payment (if positive availability)
    if ($available > 0) {
        $take = min($available, $remaining);
        $info['allocations'][] = ['pago_id' => $pago->id, 'amount_cents' => $take];
        $remaining -= $take;
    }

    // Candidates: other completed payments in same reservation
    $candidates = Pago::where('reserva_id', $rr->reserva_id)->where('estado','completado')->where('id','<>',$pago->id)->get();
    $cands = [];
    foreach ($candidates as $c) {
        $cMonto = (int)round(($c->monto ?? 0) * 100);
        $cRefunded = (int)Refund::where('pago_id', $c->id)->sum('amount_cents');
        $cAvail = $cMonto - $cRefunded;
        if ($cAvail > 0) {
            $cands[] = ['pago_id' => $c->id, 'available_cents' => $cAvail];
        }
    }
    // sort by available desc to minimize splits
    usort($cands, function($a,$b){ return $b['available_cents'] - $a['available_cents']; });

    foreach ($cands as $c) {
        if ($remaining <= 0) break;
        $take = min($c['available_cents'], $remaining);
        $info['allocations'][] = ['pago_id' => $c['pago_id'], 'amount_cents' => $take];
        $remaining -= $take;
    }

    // Consider pagos in 'procesando' state as potential future candidates
    $processing = Pago::where('reserva_id', $rr->reserva_id)->where('estado','procesando')->get();
    foreach ($processing as $p) {
        $pMonto = (int)round(($p->monto ?? 0) * 100);
        $info['pending_payments'][] = ['pago_id' => $p->id, 'monto_cents' => $pMonto, 'estado' => $p->estado];
    }

    $info['remaining_cents'] = $remaining;

    if ($remaining <= 0) {
        $info['recommendation'] = 'Reasignar (posible fraccionamiento) según asignaciones listadas.';
    } else {
        $rec = "Asignar parcialmente (según asignaciones listadas, queda " . ($remaining/100) . "€ sin cubrir). ";
        if (! empty($info['pending_payments'])) $rec .= 'Además, hay pagos en `procesando` que podrían cubrir el restante si se confirman.';
        $rec .= ' Si no, contactar cliente o procesar la parte restante fuera de Stripe (contabilidad).';
        $info['recommendation'] = $rec;
    }

    $suggestions[] = $info;
}

// Print human-readable output
foreach ($suggestions as $s) {
    echo "RefundRequest [{$s['refund_request_id']}] reserva={$s['reserva_id']} localizador=" . ($s['localizador'] ?? '-') . " requested=" . ($s['requested_amount_cents']/100) . "€\n";
    echo "  Pago referenciado: " . ($s['current_payment_id'] ?? 'NULL') . " available=" . (is_null($s['current_payment_available_cents']) ? '-' : ($s['current_payment_available_cents']/100).'€') . "\n";
    if (! empty($s['allocations'])) {
        echo "  Sugerencia de reasignación:\n";
        foreach ($s['allocations'] as $a) {
            echo "    - Pago {$a['pago_id']} => " . ($a['amount_cents']/100) . "€\n";
        }
    }
    if (! empty($s['pending_payments'])) {
        echo "  Pagos en 'procesando' (posibles futuros candidatos):\n";
        foreach ($s['pending_payments'] as $p) echo "    - Pago {$p['pago_id']} monto=" . ($p['monto_cents']/100) . "€ estado={$p['estado']}\n";
    }
    echo "  Recomendación: {$s['recommendation']}\n\n";
}

// If CSV requested, write
if ($csvPath) {
    $fp = fopen($csvPath, 'w');
    fputcsv($fp, ['refund_request_id','reserva_id','localizador','requested_amount_eur','remaining_uncovered_eur','allocations','pending_payments','recommendation']);
    foreach ($suggestions as $s) {
        $allocs = array_map(function($a){ return $a['pago_id'] . ':' . ($a['amount_cents']/100); }, $s['allocations']);
        $pending = array_map(function($p){ return $p['pago_id'] . ':' . ($p['monto_cents']/100); }, $s['pending_payments']);
        fputcsv($fp, [
            $s['refund_request_id'], $s['reserva_id'], $s['localizador'], $s['requested_amount_cents']/100, $s['remaining_cents']/100, implode('|',$allocs), implode('|',$pending), $s['recommendation']
        ]);
    }
    fclose($fp);
    echo "CSV creado en: {$csvPath}\n";
}

exit(0);
