<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;

$emps = Empleado::with('user')->orderBy('id','asc')->get(['id','user_id','departamento_id'])->map(function($e){
    return [
        'id' => $e->id,
        'user_id' => $e->user_id,
        'user_email' => $e->user?->email ?? null,
        'departamento_id' => $e->departamento_id,
    ];
});

echo "EMPLEADOS (todos):\n";
echo json_encode($emps->values(), JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;

// También listar empleados específicos 17 y 22 si existen
$ids = [17,22];
$found = Empleado::with('user')->whereIn('id',$ids)->get(['id','user_id','departamento_id'])->map(function($e){
    return [
        'id' => $e->id,
        'user_id' => $e->user_id,
        'user_email' => $e->user?->email ?? null,
        'departamento_id' => $e->departamento_id,
    ];
});

echo "\nEMPLEADOS {17,22}:\n";
echo json_encode($found->values(), JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;
