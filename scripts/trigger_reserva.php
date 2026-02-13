<?php
// scripts/trigger_reserva.php
// Usage: php scripts/trigger_reserva.php RESERVA_ID PAGO_ID REFUND_ID
if ($argc < 4) {
    echo "Usage: php scripts/trigger_reserva.php RESERVA_ID PAGO_ID REFUND_ID\n";
    exit(1);
}
$reservaId = (int)$argv[1];
$pagoId = (int)$argv[2];
$refundId = $argv[3];

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Events\ReservaActualizada;

$reserva = Reserva::with(['reservable','pagos'])->find($reservaId);
if (! $reserva) {
    echo "RESERVA_NOT_FOUND\n";
    exit(1);
}

try {
    event(new ReservaActualizada($reserva, ['pago_id' => $pagoId, 'refund_id' => $refundId]));
    echo "EVENT_EMITTED\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
