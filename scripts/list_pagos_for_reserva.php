<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Models\Pago;

$arg = $argv[1] ?? null;
if (! $arg) { echo "Usage: php scripts/list_pagos_for_reserva.php <reserva_id|localizador>\n"; exit(1); }

$reserva = is_numeric($arg) ? Reserva::with('pagos')->find((int)$arg) : Reserva::with('pagos')->where('localizador', $arg)->first();
if (! $reserva) { echo "Reserva not found: {$arg}\n"; exit(1); }

echo "Reserva id={$reserva->id} localizador={$reserva->localizador} precio_total={$reserva->precio_total}\n";
foreach ($reserva->pagos as $p) {
    echo "Pago id={$p->id} estado={$p->estado} monto={$p->monto} stripe_payment_intent_id={$p->stripe_payment_intent_id}\n";
}

exit(0);
