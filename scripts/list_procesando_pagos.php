<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;

$pagos = Pago::where('estado','procesando')->get();
$out = [];
foreach ($pagos as $p) {
    $out[] = [
        'id' => $p->id,
        'reserva_id' => $p->reserva_id,
        'stripe_checkout_session_id' => $p->stripe_checkout_session_id,
        'monto' => $p->monto,
    ];
}

echo json_encode(['count' => count($out), 'pagos' => $out], JSON_PRETTY_PRINT) . "\n";
