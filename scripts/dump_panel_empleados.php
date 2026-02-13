<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;

$empleados = Empleado::with(['user','departamento'])->orderBy('id')->get()->map(function ($empleado) {
    $data = $empleado->toArray();
    if ($empleado->user) {
        $data['name'] = $empleado->user->name;
        $data['email'] = $empleado->user->email;
        // Role information removed from dump; keep empleado.role only
        $data['roles'] = [];
        $data['role'] = $empleado->role ?? null;

        $depModel = $empleado->relationLoaded('departamento') ? $empleado->getRelation('departamento') : (\App\Models\Departamento::find($empleado->departamento_id));
        $data['departamento'] = $depModel ? $depModel->name : null;
        $data['departamento_id'] = $empleado->departamento_id ?? null;
    }
    return $data;
});

echo json_encode($empleados, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;
