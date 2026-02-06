<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Habitacion;
$habitaciones = Habitacion::where('estado', 'limpieza')->with('fotos')->get();
$action = app(\App\Actions\Habitaciones\FormatHabitacionesAction::class);
$formatted = $action->handle($habitaciones);
echo json_encode($formatted, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;
