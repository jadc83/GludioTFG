<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;

$limit = intval($argv[1] ?? 20);
$pagos = Pago::whereNotNull('stripe_payment_intent_id')->orderByDesc('id')->limit($limit)->get();
if ($pagos->isEmpty()) { echo "No pagos with stripe_payment_intent_id found.\n"; exit(0); }
foreach ($pagos as $p) {
    echo "Pago id={$p->id} reserva_id={$p->reserva_id} monto={$p->monto} estado={$p->estado} pi={$p->stripe_payment_intent_id}\n";
}
