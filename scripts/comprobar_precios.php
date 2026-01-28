<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Carbon\Carbon;

$service = app(\App\Services\PrecioService::class);

$habitaciones = [ ['tipo' => 'doble', 'cantidad' => 1], ['tipo' => 'suite', 'cantidad' => 1] ];
$checkIn = Carbon::createFromFormat('Y-m-d', '2026-07-01');
$checkOut = Carbon::createFromFormat('Y-m-d', '2026-07-03');

echo "precioSinTarifas:\n";
print_r($service->precioSinTarifas($habitaciones, $checkIn, $checkOut));

echo "precioConTarifas (sin tarifas):\n";
print_r($service->precioConTarifas($habitaciones, $checkIn, $checkOut, []));

// with tarifas (assuming IDs exist 1,2)
echo "precioConTarifas (con tarifas [1,2]):\n";
print_r($service->precioConTarifas($habitaciones, $checkIn, $checkOut, [1,2]));
