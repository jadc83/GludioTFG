<?php
require __DIR__ . "/../vendor/autoload.php";

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use App\Services\PrecioService;
use Carbon\Carbon;

$tipo = $argv[1] ?? 'doble';
$checkIn = Carbon::parse($argv[2] ?? '2026-03-01');
$checkOut = Carbon::parse($argv[3] ?? '2026-03-10');

$svc = new PrecioService();
$precioBase = $svc->getPrecio($tipo);
$entre = $svc->precioMod($tipo, $checkIn, $checkOut, 1);
$entreFechas = $svc->precioEntreFechas($tipo, $checkIn, $checkOut);

echo "Tipo: $tipo\n";
echo "Precio base: " . number_format($precioBase, 2, '.', '') . "\n";
echo "precioEntreFechas (total): " . number_format($entreFechas, 2, '.', '') . "\n";
echo "Desglose diario:\n";
foreach ($entre['desglose'] as $d) {
    echo "  {$d['fecha']} - base={$d['precioBase']} mult={$d['multiplicador']} -> dia={$d['precioDia']}\n";
}

// Average per night
$noches = $checkIn->diffInDays($checkOut);
echo "Noches: $noches\n";
echo "Avg per night: " . number_format($entreFechas / max(1, $noches), 2, '.', '') . "\n";
