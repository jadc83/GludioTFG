<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;

$arg = $argv[1] ?? null;
if (! $arg) {
    echo "Usage: php scripts/check_estados.php GKS6BC3,G1KIR63\n";
    exit(1);
}

$keys = array_filter(array_map('trim', explode(',', $arg)));
$reservas = Reserva::whereIn('localizador', $keys)->get(['localizador','pago']);

$data = [];
foreach ($reservas as $r) {
    $data[$r->localizador] = $r->pago;
}

echo json_encode(['success' => true, 'data' => $data], JSON_PRETTY_PRINT) . "\n";
