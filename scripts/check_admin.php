<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'dominguezcamachojose@gmail.com';

try {
    $u = App\Models\User::where('email', $email)->first();
    if (! $u) {
        echo "NOT_FOUND\n";
        exit(0);
    }

    // Role inspection removed; return basic user info
    echo json_encode(['id' => $u->id, 'email' => $u->email], JSON_UNESCAPED_UNICODE) . "\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
