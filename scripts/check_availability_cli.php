<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use Illuminate\Support\Facades\DB;

$tipo = 'familiar';
$checkIn = '2026-01-31';
$checkOut = '2026-02-05';

echo "Comprobando disponibilidad tipo={$tipo} desde {$checkIn} hasta {$checkOut}\n";

$total = Habitacion::where('tipo', $tipo)->where('estado', '!=', 'mantenimiento')->count();
$placeholders = HabitacionReserva::where('tipo', $tipo)->whereNull('habitacion_id')->where('check_in', '<', $checkOut)->where('check_out', '>', $checkIn)->get();
$assigned = HabitacionReserva::whereNotNull('habitacion_id')->where('check_in', '<', $checkOut)->where('check_out', '>', $checkIn)
    ->join('habitaciones', 'habitacion_reserva.habitacion_id', '=', 'habitaciones.id')
    ->where('habitaciones.tipo', $tipo)->distinct('habitacion_reserva.habitacion_id')->count('habitacion_reserva.habitacion_id');

$placeholdersCount = $placeholders->count();
$placeholdersPrecio0 = $placeholders->where('precio', 0)->count();

echo "Total habitaciones tipo {$tipo}: {$total}\n";
echo "Placeholders sin asignar que solapan: {$placeholdersCount}\n";
echo "Placeholders con precio=0: {$placeholdersPrecio0}\n";
echo "Habitaciones asignadas (distintas): {$assigned}\n";

echo "Detalle placeholders:\n";
foreach ($placeholders as $ph) {
    echo "  id={$ph->id} reserva_id={$ph->reserva_id} precio=" . ($ph->precio ?? 'NULL') . " check_in={$ph->check_in} check_out={$ph->check_out}\n";
}
