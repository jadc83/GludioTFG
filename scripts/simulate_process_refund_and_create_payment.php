<?php
// Uso: php scripts/simulate_process_refund_and_create_payment.php <refund_request_id>
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RefundRequest;
use App\Models\Refund;
use App\Services\RefundService;
use App\Services\PaymentService;

$rrId = $argv[1] ?? null;
if (! $rrId) {
    echo "Uso: php scripts/simulate_process_refund_and_create_payment.php <refund_request_id>\n";
    exit(1);
}

$rr = RefundRequest::with(['reserva','pago'])->find($rrId);
if (! $rr) {
    echo "RefundRequest {$rrId} no encontrada\n";
    exit(1);
}

echo "Procesando simulación para RefundRequest id={$rr->id} reserva_id={$rr->reserva_id}\n";

$amountCents = $rr->requested_amount_cents ?? ($rr->processed_refund_amount_cents ?? 0);
if (! $amountCents) {
    echo "No hay monto solicitado en RefundRequest\n";
    exit(1);
}

// Crear Refund local
try {
    $refund = Refund::create([
        'pago_id' => $rr->pago_id,
        'reserva_id' => $rr->reserva_id,
        'amount_cents' => $amountCents,
        'currency' => 'eur',
        'status' => 'succeeded',
        'stripe_refund_id' => 'simulated_refund_' . time(),
        'stripe_response' => ['simulated' => true, 'requested_amount_cents' => $amountCents],
    ]);

    $rr->update([
        'status' => 'processed',
        'processed_at' => now(),
        'processed_refund_amount_cents' => $amountCents,
        'stripe_refund_id' => $refund->stripe_refund_id,
    ]);

    echo "Refund local creado id={$refund->id} amount=" . ($refund->amount_cents/100) . "€\n";
} catch (\Throwable $e) {
    echo "Error creando Refund local: " . $e->getMessage() . "\n";
    exit(1);
}

// Sincronizar estado reserva
try {
    $refundService = app(RefundService::class);
    $refundService->sincronizarEstadoReservaSegunReembolsos($rr->reserva);
    echo "Estado de reserva sincronizado.\n";
} catch (\Throwable $e) {
    echo "Error sincronizando estado: " . $e->getMessage() . "\n";
}

// Crear PaymentIntent para nuevo total
try {
    $paymentService = app(PaymentService::class);
    $monto = $rr->pending_nuevo_total ?? ($rr->reserva->precio_total ?? null);
    if (! $monto) {
        echo "No hay monto para crear PaymentIntent\n";
        exit(0);
    }
    echo "Creando PaymentIntent para monto: {$monto}€\n";
    $result = $paymentService->crearPaymentIntentParaReserva($rr->reserva, (float)$monto);
    print_r($result);
    echo "Hecho.\n";
} catch (\Throwable $e) {
    echo "Error creando PaymentIntent: " . $e->getMessage() . "\n";
}
