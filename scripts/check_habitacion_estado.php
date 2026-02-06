<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Habitacion;

$h = Habitacion::where('numero', '100')->first();
if (!$h) { echo "Habitacion 100: NOT FOUND\n"; exit; }

echo "Habitacion 100: numero={$h->numero} estado={$h->estado} tipo={$h->tipo} capacidad={$h->capacidad}\n";
