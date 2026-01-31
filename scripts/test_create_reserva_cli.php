<?php
// Script CLI: bootstrap Laravel and call CreateReservaAction directly (avoids CSRF/web middleware)
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Actions\Reservas\CreateReservaAction;
use App\Models\User;

$payload = [
    'name' => 'CLI Prueba Reserva',
    'email' => 'cli-test@example.com',
    'telefono' => '611111111',
    'tipo_documento' => 'dni',
    'numero_documento' => 'CLI12345X',
    'nacionalidad' => 'ES',
    'direccion' => [
        'calle' => 'Calle CLI 1',
        'ciudad' => 'Ciudad',
        'codigo_postal' => '11111',
        'pais' => 'ES'
    ],
    'check_in' => date('Y-m-d', strtotime('+7 days')),
    'check_out' => date('Y-m-d', strtotime('+9 days')),
    'habitaciones' => [ ['tipo' => 'doble', 'cantidad' => 1, 'personas_por_habitacion' => 2] ],
    'tarifas' => [],
];

try {
    $action = app(CreateReservaAction::class);
    $user = User::find(1);
    echo "Llamando CreateReservaAction::handle...\n";
    $result = $action->handle($payload, $user, 'pendiente');
    echo "Resultado: ";
    print_r($result);
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
