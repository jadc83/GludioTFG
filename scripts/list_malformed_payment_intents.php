<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;

$bad = [];
foreach (Pago::whereNotNull('stripe_payment_intent_id')->cursor() as $p) {
    $id = (string)$p->stripe_payment_intent_id;
    $clean = trim(preg_replace('/[[:cntrl:]]+/', '', $id));
    if (!preg_match('/^pi_[A-Za-z0-9_]+$/', $clean)) {
        $bad[] = ['pago_id' => $p->id, 'reserva_id' => $p->reserva_id, 'stripe_payment_intent_id' => $id];
    }
}

if (empty($bad)) {
    echo "No malformed PaymentIntent ids found.\n";
    exit(0);
}

echo "Found malformed PaymentIntent ids:\n";
foreach ($bad as $row) {
    echo sprintf("Pago ID: %d, Reserva ID: %s, stripe_payment_intent_id: %s\n", $row['pago_id'], $row['reserva_id'] ?? 'NULL', $row['stripe_payment_intent_id']);
}

echo "\nIf there are only whitespace/control characters, you can fix them by running an update, e.g.:\n";
echo "php -r \"require 'bootstrap/autoload.php'; /* use Eloquent update to trim values */\"\n";
