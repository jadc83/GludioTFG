<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = App\Models\User::where('email','joseantonio.dominguez@iesdonana.org')->first();
if (!$u) {
    echo "not found\n";
    exit(0);
}

// Role listing removed
echo json_encode(['id' => $u->id, 'email' => $u->email], JSON_UNESCAPED_UNICODE) . PHP_EOL;
