<?php
// Uso: php scripts/test_refund_request_after_date_change.php <reserva_id|localizador> <new_check_in:YYYY-MM-DD> <new_check_out:YYYY-MM-DD>
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Models\RefundRequest;
use App\Services\ReservaService;

$arg = $argv[1] ?? null;
$newCheckIn = $argv[2] ?? null;
$newCheckOut = $argv[3] ?? null;

if (! $arg || ! $newCheckIn || ! $newCheckOut) {
    echo "Uso: php scripts/test_refund_request_after_date_change.php <reserva_id|localizador> <new_check_in> <new_check_out>\n";
    echo "Ejemplo: php scripts/test_refund_request_after_date_change.php GVWBXLE 2026-06-01 2026-06-05\n";
    exit(1);
}

// Buscar por id o localizador
$reserva = is_numeric($arg)
    ? Reserva::with(['pagos', 'refundRequests'])->find((int)$arg)
    : Reserva::with(['pagos', 'refundRequests'])->where('localizador', $arg)->first();

if (! $reserva) {
    echo "Reserva no encontrada: {$arg}\n";
    exit(1);
}

echo "Reserva encontrada: id={$reserva->id} localizador={$reserva->localizador}\n";
echo "Precio actual: {$reserva->precio_total}\n";

echo "RefundRequests antes:\n";
foreach ($reserva->refundRequests as $rr) {
    echo " - [{$rr->id}] status={$rr->status} requested=" . (($rr->requested_amount_cents ?? 0)/100) . " pending_nuevo_total={$rr->pending_nuevo_total}\n";
}

$svc = $app->make(ReservaService::class);

// Preparar payload similar al controlador
$payload = [
    'check_in' => $newCheckIn,
    'check_out' => $newCheckOut,
    'status' => $reserva->status,
    'pago' => $reserva->pago,
    'notas' => $reserva->notas ?? null,
];

echo "Aplicando actualizarReserva(...) con fechas {$newCheckIn} -> {$newCheckOut}...\n";
$result = [];
try {
    $result = $svc->actualizarReserva($reserva, $payload);
    echo "Resultado: "; print_r($result);
} catch (\Throwable $e) {
    echo "Error ejecutando actualizarReserva: " . $e->getMessage() . "\n";
    exit(1);
}

// Esperar un momento para afterCommit y callbacks
usleep(500000); // 0.5s

$fresh = Reserva::with(['refundRequests'])->find($reserva->id);

echo "RefundRequests despues:\n";
foreach ($fresh->refundRequests as $rr) {
    echo " - [{$rr->id}] status={$rr->status} requested=" . (($rr->requested_amount_cents ?? 0)/100) . " pending_nuevo_total={$rr->pending_nuevo_total}\n";
}

echo "Hecho. Revisa la tabla refund_requests para más detalles.\n";
