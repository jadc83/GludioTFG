<?php
// Uso: php scripts/find_refund_requests_with_insufficient_balance.php [reserva_id|localizador]
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RefundRequest;
use App\Models\Refund;
use App\Models\Pago;
use App\Models\Reserva;

$arg = $argv[1] ?? null;
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
$all = $query->with(['reserva','pago'])->orderBy('id')->get();

if ($all->isEmpty()) {
    echo "No refund requests (pending/processed) found" . ($reserva ? " for reserva {$reserva->localizador} (id={$reserva->id})" : '') . "\n";
    exit(0);
}

$summary = ['total' => $all->count(), 'insufficient' => 0];
foreach ($all as $rr) {
    $reqAmt = (int)($rr->requested_amount_cents ?? 0);
    $res = $rr->reserva;
    $pago = $rr->pago;

    echo "[RR {$rr->id}] status={$rr->status} requested=" . ($reqAmt/100) . "€ reserva_id={$rr->reserva_id}";
    if ($res) echo " localizador={$res->localizador}";
    echo " pago_id=" . ($pago? $pago->id : 'NULL') . "\n";

    if (! $pago) {
        echo "  -> Sin pago asociado. Requiere revisión manual.\n\n";
        $summary['insufficient']++;
        continue;
    }

    $pagoMontoCents = (int)round(($pago->monto ?? 0) * 100);
    $alreadyRefunded = (int)Refund::where('pago_id', $pago->id)->sum('amount_cents');
    $available = $pagoMontoCents - $alreadyRefunded;

    echo "  Pago id={$pago->id} estado={$pago->estado} monto=" . ($pagoMontoCents/100) . "€ refunded=" . ($alreadyRefunded/100) . "€ available=" . ($available/100) . "€\n";

    // Recommendation logic
    if ($pago->estado !== 'completado') {
        echo "  -> Recomendación: el pago no está completado (estado={$pago->estado}). Esperar o contactar al cliente para completar el método de pago.\n";
    }

    if ($available >= $reqAmt) {
        echo "  -> Acción sugerida: suficiente saldo en el pago referenciado para procesar este refund.
";
    } else {
        $summary['insufficient']++;
        echo "  -> ALERTA: saldo insuficiente (disponible=" . ($available/100) . "€, solicitado=" . ($reqAmt/100) . "€).\n";

        // Buscar candidatos en la misma reserva
        $candidates = Pago::where('reserva_id', $rr->reserva_id)->where('estado','completado')->get();
        $found = [];
        foreach ($candidates as $c) {
            $cMonto = (int)round(($c->monto ?? 0) * 100);
            $cRefunded = (int)Refund::where('pago_id', $c->id)->sum('amount_cents');
            $cAvail = $cMonto - $cRefunded;
            if ($cAvail > 0) $found[] = [ 'id' => $c->id, 'available' => $cAvail ];
        }

        if (! empty($found)) {
            echo "  -> Candidatos en la misma reserva con saldo disponible:\n";
            foreach ($found as $f) echo "     - Pago {$f['id']} available=" . ($f['available']/100) . "€\n";
            echo "     -> Acción sugerida: reasignar RefundRequest a uno de los pagos candidatos con saldo.\n";
        } else {
            echo "  -> No hay pagos completados con saldo disponible en esta reserva.\n";
            echo "     -> Opciones: (a) esperar a que un Pago en 'procesando' se confirme, (b) contactar cliente para cobro nuevo, (c) gestionar manualmente en contabilidad.\n";
        }
    }

    echo "\n";
}

echo "Resumen: total={$summary['total']} problemáticos={$summary['insufficient']}\n";
exit(0);
