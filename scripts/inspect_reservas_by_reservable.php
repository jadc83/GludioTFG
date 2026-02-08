<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;

$reservableId = $argv[1] ?? null;
if (! $reservableId) { echo "Usage: php scripts/inspect_reservas_by_reservable.php {reservable_id}\n"; exit(1); }

$reservas = Reserva::with(['pagos','habitaciones'])->where('reservable_id', $reservableId)->orderBy('created_at','desc')->get();

echo json_encode($reservas->toArray(), JSON_PRETTY_PRINT) . "\n";

foreach ($reservas as $r) {
    echo "Localizador={$r->localizador} id={$r->id} check_in={$r->check_in} check_out={$r->check_out} status={$r->status} pago={$r->pago} precio_total={$r->precio_total}\n";
}

exit(0);
