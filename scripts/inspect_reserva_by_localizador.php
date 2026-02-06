<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;

$localizador = $argv[1] ?? null;
if (! $localizador) { echo "Usage: php scripts/inspect_reserva_by_localizador.php {localizador}\n"; exit(1); }

$res = Reserva::with(['reservable', 'pagos', 'habitaciones'])->where('localizador', $localizador)->first();
if (! $res) { echo "Reserva {$localizador} no encontrada\n"; exit(1); }

echo json_encode($res->toArray(), JSON_PRETTY_PRINT) . "\n";

foreach ($res->pagos as $p) {
    echo "Pago id={$p->id} reserva_id={$p->reserva_id} monto={$p->monto} estado={$p->estado} stripe_checkout_session_id={$p->stripe_checkout_session_id}\n";
}

exit(0);
