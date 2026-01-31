<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;

$pagoId = $argv[1] ?? null;
if (! $pagoId) { echo "Usage: php simulate_pago_success.php {pago_id}\n"; exit(1); }

$pago = Pago::find($pagoId);
if (! $pago) { echo "Pago {$pagoId} no encontrado\n"; exit(1); }

try {
	if (method_exists($pago, 'marcarComoPagado')) {
		$pago->marcarComoPagado();
		echo "Pago {$pagoId} marcado como pagado.\n";
	} else {
		$pago->update(['estado' => 'pagado']);
		echo "Pago {$pagoId} actualizado estado=pagado.\n";
	}
	// actualizar reserva si existe
	if ($pago->reserva) {
		$pago->reserva->update(['pago' => 'pagado']);
		echo "Reserva {$pago->reserva->id} marcada como pagado.\n";
	}
} catch (\Exception $e) {
	echo "Error marcando pago como pagado: " . $e->getMessage() . "\n";
	exit(1);
}
