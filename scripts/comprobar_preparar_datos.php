<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Carbon\Carbon;

$service = app(\App\Services\ReservaService::class);

$payload = [
    'name' => 'Test',
    'email' => 'test@example.com',
    'telefono' => '123',
    'check_in' => '2026-07-01',
    'check_out' => '2026-07-03',
    'habitaciones' => [ ['tipo' => 'doble', 'cantidad' => 1], ['tipo' => 'suite', 'cantidad' => 1] ],
];

try {
    $datos = $service->prepararDatosReserva($payload);
    print_r($datos);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
