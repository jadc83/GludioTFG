<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\PaymentService;

$svc = new PaymentService();

echo "Test 1: crearPaymentIntentStandalone sin metadata (esperado: error)\n";
$resp1 = $svc->crearPaymentIntentStandalone(10.0, []);
echo json_encode($resp1, JSON_PRETTY_PRINT) . "\n\n";

echo "Test 2: crearPaymentIntentStandalone con metadata.reserva_id (esperado: success)\n";
$resp2 = $svc->crearPaymentIntentStandalone(10.0, ['metadata' => ['reserva_id' => '1']]);
echo json_encode($resp2, JSON_PRETTY_PRINT) . "\n\n";

echo "Test 3: crearPaymentIntentStandalone forzando allow_without_metadata (esperado: success)\n";
$resp3 = $svc->crearPaymentIntentStandalone(10.0, ['allow_without_metadata' => true]);
echo json_encode($resp3, JSON_PRETTY_PRINT) . "\n\n";

exit(0);
