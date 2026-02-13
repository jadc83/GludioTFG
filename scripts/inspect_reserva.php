<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;

$arg = $argv[1] ?? null;
if (! $arg) { echo "Usage: php scripts/inspect_reserva.php {id|localizador}\n"; exit(1); }

if (is_numeric($arg)) {
    $res = Reserva::with(['reservable', 'habitaciones'])->find((int)$arg);
} else {
    $res = Reserva::with(['reservable', 'habitaciones'])->where('localizador', $arg)->first();
}
if (! $res) { echo "Reserva {$arg} no encontrada\n"; exit(1); }

echo "Reserva id={$res->id} localizador={$res->localizador} check_in={$res->check_in} check_out={$res->check_out} precio_total={$res->precio_total}\n";
echo "Reservable: "; print_r($res->reservable?->toArray());

foreach ($res->habitaciones as $h) {
    echo "HR id={$h->id} habitacion_id={$h->habitacion_id} tipo={$h->tipo} precio={$h->precio} check_in={$h->check_in} check_out={$h->check_out}\n";
}
