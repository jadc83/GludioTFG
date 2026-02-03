<?php
// Ejecutar: php scripts/test_reembolso.php [<reserva_id>]
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Log;

$reservaId = $argv[1] ?? null;
$montoArg = isset($argv[2]) ? (float)$argv[2] : null;
$reserva = $reservaId ? Reserva::with('pagos')->find($reservaId) : Reserva::with('pagos')->whereHas('pagos', function($q){$q->where('estado','completado');})->orderByDesc('id')->first();

if (! $reserva) {
    echo "No se encontró una reserva con pago completado. Pasa un reserva_id como argumento.\n";
    exit(1);
}

$paymentService = $app->make(PaymentService::class);

echo "Probando reembolso para reserva id={$reserva->id} localizador={$reserva->localizador}\n";
$result = $paymentService->solicitarReembolso($reserva, null, $montoArg);
print_r($result);

if (!empty($result['success'])) {
    echo "OK: refund id=" . ($result['refund_id'] ?? 'N/A') . " amount=" . ($result['refund_amount'] ?? 'N/A') . "\n";
} else {
    echo "Fallo: " . ($result['message'] ?? json_encode($result)) . "\n";
}
