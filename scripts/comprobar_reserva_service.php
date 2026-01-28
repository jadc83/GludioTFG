<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Models\Habitacion;
use App\Models\Reserva;
use App\Services\ReservaService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

$app = require __DIR__ . '/../bootstrap/app.php';
// Bootstrap minimal para usar facades
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = new ReservaService();

DB::beginTransaction();
try {
    echo "Iniciando comprobación no destructiva de ReservaService...\n";

    // Crear dos habitaciones dobles
    Habitacion::create(['numero' => 'D1', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);
    Habitacion::create(['numero' => 'D2', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);

    $checkIn = Carbon::parse('2026-04-10');
    $checkOut = Carbon::parse('2026-04-12');

    // Caso 1: pedir 2 dobles → OK
    try {
        $ok = $service->verificarDisponibilidadMultiple([['tipo' => 'doble', 'cantidad' => 2]], $checkIn, $checkOut);
        echo "Verificación para 2 dobles: OK\n";
    } catch (\Throwable $e) {
        echo "Verificación para 2 dobles: FALLÓ - " . $e->getMessage() . "\n";
    }

    // Contar cuántas dobles están disponibles para el rango y pedir (disponibles+1) para comprobar fallo
    $disponiblesQuery = \App\Models\Habitacion::where('tipo', 'doble')
        ->where('estado', '!=', 'mantenimiento')
        ->whereDoesntHave('reservas', function ($q) use ($checkIn, $checkOut) {
            $q->where('check_in', '<', $checkOut)
              ->where('check_out', '>', $checkIn);
        })->count();

    echo "Disponibles dobles (consulta): {$disponiblesQuery}\n";

    try {
        $service->verificarDisponibilidadMultiple([['tipo' => 'doble', 'cantidad' => $disponiblesQuery + 1]], $checkIn, $checkOut);
        echo "Verificación para (disponibles+1): inesperado OK\n";
    } catch (\Throwable $e) {
        echo "Verificación para (disponibles+1): esperado fallo -> " . $e->getMessage() . "\n";
    }

    // Caso 3: crear reserva usando el servicio y asignar placeholder
    $datosReserva = [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'telefono' => '000000000',
        'numero_documento' => 'TEST123',
        'check_in' => $checkIn->toDateString(),
        'check_out' => $checkOut->toDateString(),
        'habitaciones' => [['tipo' => 'doble', 'cantidad' => 1, 'personas_por_habitacion' => 1]],
    ];

    $reserva = $service->crearReserva($datosReserva, null, 'pendiente');

    $placeholders = \App\Models\HabitacionReserva::where('reserva_id', $reserva->id)->whereNull('habitacion_id')->get();
    echo "Placeholders creados: " . $placeholders->count() . "\n";

    echo "Comprobación completada (los cambios serán revertidos).\n";

    DB::rollBack();
} catch (\Throwable $e) {
    DB::rollBack();
    echo "Error en comprobación: " . $e->getMessage() . "\n";
}
