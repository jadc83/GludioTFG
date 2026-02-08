<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$res = \App\Models\Reserva::find(14);
if ($res) {
    echo json_encode([
        'id' => $res->id,
        'check_in' => (string)$res->check_in,
        'check_out' => (string)$res->check_out,
        'precio_total' => (float)$res->precio_total,
    ]);
} else {
    echo json_encode(new stdClass());
}
