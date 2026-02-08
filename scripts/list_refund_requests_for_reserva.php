<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Models\RefundRequest;

$arg = $argv[1] ?? null;
if (! $arg) { echo "Usage: php scripts/list_refund_requests_for_reserva.php {reserva_id|localizador}\n"; exit(1); }

$reserva = is_numeric($arg) ? Reserva::find((int)$arg) : Reserva::where('localizador', $arg)->first();
if (! $reserva) { echo "Reserva not found: {$arg}\n"; exit(1); }

echo "Reserva id={$reserva->id} localizador={$reserva->localizador}\n";
$r = RefundRequest::where('reserva_id', $reserva->id)->orderByDesc('id')->get();
if ($r->isEmpty()) { echo "No refund requests found for reserva\n"; exit(0); }

foreach ($r as $rr) {
    echo "[{$rr->id}] status={$rr->status} requested=" . (($rr->requested_amount_cents ?? 0)/100) . " pending_nuevo_total={$rr->pending_nuevo_total} admin_id={$rr->admin_id} processed_at={$rr->processed_at}\n";
}

exit(0);
