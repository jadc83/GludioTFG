<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;

$pago = Pago::find(39);
if (! $pago) { echo "Pago 39 not found\n"; exit(1); }

try {
    echo "Antes: estado={$pago->estado} pagado_en={$pago->pagado_en}\n";
    $pago->update(['estado' => 'completado', 'pagado_en' => now()]);
    $pago->reserva->update(['pago' => 'pagado']);
    $pago->refresh();
    echo "Después: estado={$pago->estado} pagado_en={$pago->pagado_en}\n";
    echo "Reserva pago={$pago->reserva->pago}\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    \Illuminate\Support\Facades\Log::error('force_mark_paid error: ' . $e->getMessage());
}
