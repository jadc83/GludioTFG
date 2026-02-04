<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Services\PaymentService;

$arg = $argv[1] ?? null;

if ($arg) {
    $reserva = Reserva::where('localizador', $arg)->first();
} else {
    $reserva = Reserva::latest()->first();
}

if (! $reserva) {
    echo "No reserva found. Provide a localizador as first argument or ensure DB has reservas.\n";
    exit(1);
}

$paymentService = new PaymentService();
$resp = $paymentService->crearCheckoutSessionParaReserva($reserva, (float)($argv[2] ?? $reserva->precio_total ?? 0.0));

var_export($resp);

echo "\n\nCheck storage/logs/laravel.log for 'Stripe Checkout creado' entry with success_url/session_url details.\n";
