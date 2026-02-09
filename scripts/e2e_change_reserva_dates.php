<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Support\Facades\Log;

$reservaId = $argv[1] ?? null;
if (! $reservaId) { echo "Usage: php scripts/e2e_change_reserva_dates.php {reserva_id}\n"; exit(1); }

$reserva = Reserva::find($reservaId);
if (! $reserva) { echo "Reserva {$reservaId} not found\n"; exit(1); }

echo "Current reserva id={$reserva->id} localizador={$reserva->localizador} check_in={$reserva->check_in} check_out={$reserva->check_out} precio_total={$reserva->precio_total}\n";

$newCheckOut = date('Y-m-d', strtotime($reserva->check_out . ' +1 day'));
$validated = [
    'check_in' => $reserva->check_in,
    'check_out' => $newCheckOut,
    'status' => $reserva->status ?? 'confirmado',
    'pago' => $reserva->pago ?? 'pagado',
    'notas' => $reserva->notas ?? null,
];

/** @var ReservaService $svc */
$svc = app(ReservaService::class);

try {
    $resp = $svc->actualizarReserva($reserva, $validated);
    echo "Update response: " . json_encode($resp, JSON_PRETTY_PRINT) . "\n";
} catch (\Throwable $e) {
    echo "Error updating reserva: " . $e->getMessage() . "\n";
    Log::error('E2E update reserva failed: ' . $e->getMessage(), ['reserva_id' => $reserva->id]);
    exit(1);
}

// Show last 80 lines of laravel log to capture generated events
echo "\n--- tail laravel.log (last 120 lines) ---\n";
passthru('powershell -Command "Get-Content storage\\logs\\laravel.log -Tail 120 | Out-String -Width 4096"');

exit(0);
