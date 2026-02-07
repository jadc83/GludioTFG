<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Departamento;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Datos
$email = 'pepe@pepe.es';
$name = 'Pepito Limpiezas';
$deptName = 'LIMPIEZA';
$password = env('DEFAULT_NEW_USER_PASSWORD', 'password');

// 1) departamento
$dep = Departamento::firstOrCreate(['name' => $deptName]);

// 2) usuario
$user = User::where('email', $email)->first();
if (!$user) {
    $user = User::create([
        'name' => $name,
        'email' => $email,
        'password' => Hash::make($password),
        'tipo_documento' => 'dni',
        'numero_documento' => '00000000T',
        'nacionalidad' => 'Española',
        'direccion' => '',
        'telefono' => '',
    ]);
    echo "User created\n";
} else {
    echo "User already exists\n";
}

// 3) asignar rol operario si existe
try {
        if (! $user->hasRole('operario')) {
            $user->assignRole('operario');
            echo "Assigned role 'operario' to user\n";
        } else {
            echo "User already has role 'operario'\n";
} catch (\Throwable $e) {
    echo "Error assigning role: " . $e->getMessage() . "\n";
}

// 4) crear empleado si no existe
$empleado = $user->empleado;
if (!$empleado) {
    $empleado = $user->empleado()->create([
        'departamento_id' => $dep->id,
    ]);
    echo "Empleado created and assigned to department {$dep->name}\n";
} else {
    // actualizar departamento
    $empleado->update(['departamento_id' => $dep->id]);
    echo "Empleado updated with department {$dep->name}\n";
}

// Resultado
$user->load('empleado', 'roles');
$result = [
    'user' => $user->only(['id','name','email']),
    'roles' => $user->getRoleNames()->toArray(),
    'empleado' => $user->empleado ? $user->empleado->toArray() : null,
    'departamento' => $dep->toArray(),
];

echo json_encode($result, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;
