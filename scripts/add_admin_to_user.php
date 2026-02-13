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

// Role management skipped: this script no longer assigns roles.
$user = User::where('email', $email)->first();
if (!$user) {
    echo "User with email {$email} not found.\n";
    exit(1);
}

echo "Role assignment skipped for user {$user->email} (id={$user->id}).\n";
