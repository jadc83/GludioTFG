<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tarea;
use App\Models\Habitacion;

$tareas = Tarea::with('habitacion','empleado')->orderBy('id','desc')->get(['id','descripcion','status','empleado_id','habitacion_id','created_at','completed_at'])->map(function($t){
    return [
        'id' => $t->id,
        'descripcion' => $t->descripcion,
        'status' => $t->status,
        'empleado_id' => $t->empleado_id,
        'habitacion_id' => $t->habitacion_id,
        'habitacion_numero' => $t->habitacion?->numero ?? null,
        'created_at' => (string) $t->created_at,
        'completed_at' => (string) $t->completed_at,
    ];
});

$habitaciones_limpieza = Habitacion::where('estado','limpieza')->get(['id','numero','estado'])->toArray();

echo "TAREAS (últimas 100):\n";
echo json_encode($tareas->take(100)->values(), JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;

echo "\nHABITACIONES EN limpieza: (count=" . count($habitaciones_limpieza) . ")\n";
echo json_encode($habitaciones_limpieza, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;
