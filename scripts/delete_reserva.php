<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;

$id = 459;
$res = Reserva::find($id);
if (! $res) {
    echo "Reserva {$id} no encontrada\n";
    exit(0);
}

echo "Borrando reserva {$id} y sus habitaciones...\n";
$res->habitaciones()->delete();
$res->delete();

echo "Hecho.\n";
