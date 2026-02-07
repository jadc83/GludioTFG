<?php

// Script para asignar rol 'admin' a un usuario por email.
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

$email = 'joseantonio.dominguez@iesdonana.org';
$roleName = 'admin';

// Asegurarse de que el rol exista
Role::firstOrCreate(['name' => $roleName]);

$user = User::where('email', $email)->first();
if (!$user) {
    echo "User with email {$email} not found.\n";
    exit(1);
}

$user->assignRole($roleName);
echo "Assigned role '{$roleName}' to user {$user->email} (id={$user->id}).\n";
