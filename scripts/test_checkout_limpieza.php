<?php
// Script CLI: Test checkout functionality with room status change to 'limpieza'
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Actions\Reservas\CreateReservaAction;
use App\Actions\Reservas\MarcarCheckInAction;
use App\Actions\Reservas\MarcarCheckOutAction;
use App\Models\User;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;

echo "=== TEST: Checkout con cambio de estado de habitaciones a 'limpieza' ===\n\n";

try {
    // 1. Crear una reserva
    echo "1. Creando reserva...\n";
    $payload = [
        'name' => 'Test Checkout Limpieza',
        'email' => 'test-checkout@example.com',
        'telefono' => '622222222',
        'tipo_documento' => 'dni',
        'numero_documento' => 'TEST12345X',
        'nacionalidad' => 'ES',
        'direccion' => [
            'calle' => 'Calle Test 1',
            'ciudad' => 'Ciudad Test',
            'codigo_postal' => '22222',
            'pais' => 'ES'
        ],
        'check_in' => date('Y-m-d'), // Hoy para poder hacer check-in
        'check_out' => date('Y-m-d', strtotime('+2 days')),
        'habitaciones' => [ ['tipo' => 'doble', 'cantidad' => 1, 'personas_por_habitacion' => 2] ],
        'tarifas' => [],
    ];

    $createAction = app(CreateReservaAction::class);
    $user = User::find(1);
    $createResult = $createAction->handle($payload, $user, 'pendiente');

    if (!$createResult['success']) {
        throw new Exception('Error creando reserva: ' . ($createResult['error'] ?? 'Error desconocido'));
    }

    $localizador = $createResult['reserva']['localizador'];
    echo "   Reserva creada con localizador: $localizador\n";

    // 2. Marcar como checked_in
    echo "2. Marcando reserva como checked_in...\n";
    $checkInAction = app(MarcarCheckInAction::class);
    $checkInResult = $checkInAction->handle($localizador);

    if (!$checkInResult['success']) {
        throw new Exception('Error en check-in: ' . ($checkInResult['error'] ?? 'Error desconocido'));
    }

    echo "   Check-in realizado exitosamente\n";

    // 3. Verificar estado inicial de habitaciones
    echo "3. Verificando estado inicial de habitaciones...\n";
    $reserva = \App\Models\Reserva::where('localizador', $localizador)->first();
    $habitacionesReservadas = HabitacionReserva::where('reserva_id', $reserva->id)
        ->whereNotNull('habitacion_id')
        ->with('habitacion')
        ->get();

    echo "   Habitaciones asignadas:\n";
    foreach ($habitacionesReservadas as $hr) {
        echo "   - Habitación {$hr->habitacion->numero}: estado '{$hr->habitacion->estado}'\n";
    }

    // 4. Ejecutar checkout
    echo "4. Ejecutando checkout...\n";
    $checkOutAction = app(MarcarCheckOutAction::class);
    $checkOutResult = $checkOutAction->handle($localizador);

    if (!$checkOutResult['success']) {
        throw new Exception('Error en checkout: ' . ($checkOutResult['error'] ?? 'Error desconocido'));
    }

    echo "   Checkout realizado exitosamente\n";

    // 5. Verificar que las habitaciones estén en estado 'limpieza'
    echo "5. Verificando estado de habitaciones después del checkout...\n";
    $habitacionesReservadas->load('habitacion'); // Recargar datos

    $todasLimpieza = true;
    foreach ($habitacionesReservadas as $hr) {
        $estado = $hr->habitacion->estado;
        echo "   - Habitación {$hr->habitacion->numero}: estado '{$estado}'\n";
        if ($estado !== 'limpieza') {
            $todasLimpieza = false;
        }
    }

    // 6. Resultado final
    echo "\n=== RESULTADO DEL TEST ===\n";
    if ($todasLimpieza) {
        echo "✅ TEST PASADO: Todas las habitaciones están en estado 'limpieza' después del checkout\n";
    } else {
        echo "❌ TEST FALLADO: Algunas habitaciones no están en estado 'limpieza'\n";
    }

    echo "Reserva final status: {$reserva->fresh()->status}\n";

} catch (\Exception $e) {
    echo "❌ ERROR EN EL TEST: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DEL TEST ===\n";
