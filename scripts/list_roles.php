<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Role;

$roles = Role::whereNotIn('name', ['admin','user'])->pluck('name')->toArray();
echo json_encode($roles, JSON_UNESCAPED_UNICODE) . PHP_EOL;
