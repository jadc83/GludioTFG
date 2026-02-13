<?php
// Script seguro para corregir clientes con name = 'Sin nombre' usando email como clave
// Ejecutar: php scripts/fix_client_names_from_email.php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;
use App\Models\User;
use App\Models\Reserva;

$clients = Cliente::where('name', 'Sin nombre')
    ->whereNotNull('email')
    ->get();

if ($clients->isEmpty()) {
    echo "No hay clientes con name = 'Sin nombre' y email.\n";
    exit(0);
}

$updated = 0;
$skipped = 0;
$log = [];

foreach ($clients as $c) {
    $email = strtolower(trim($c->email ?? ''));
    if (!$email) { $skipped++; continue; }

    // 1) Buscar otro cliente con mismo email y nombre válido
    $otherCliente = Cliente::where('email', $email)
        ->where('id', '!=', $c->id)
        ->where('name', '!=', 'Sin nombre')
        ->first();
    if ($otherCliente && $otherCliente->name) {
        $old = $c->name;
        $c->name = $otherCliente->name;
        $c->save();
        $updated++;
        $log[] = [ 'id' => $c->id, 'email' => $email, 'from' => $old, 'to' => $c->name, 'source' => 'cliente_duplicate' ];
        continue;
    }

    // 2) Buscar User con mismo email
    $user = User::where('email', $email)->first();
    if ($user && $user->name) {
        $old = $c->name;
        $c->name = $user->name;
        $c->save();
        $updated++;
        $log[] = [ 'id' => $c->id, 'email' => $email, 'from' => $old, 'to' => $c->name, 'source' => 'user' ];
        continue;
    }

    // 3) Buscar reservas donde booked_by_user (user) tenga ese email
    $resBookedBy = Reserva::whereHas('bookedBy', function($q) use ($email) { $q->where('email', $email); })->orderByDesc('id')->first();
    if ($resBookedBy && $resBookedBy->bookedBy && $resBookedBy->bookedBy->name) {
        $old = $c->name;
        $c->name = $resBookedBy->bookedBy->name;
        $c->save();
        $updated++;
        $log[] = [ 'id' => $c->id, 'email' => $email, 'from' => $old, 'to' => $c->name, 'source' => 'booked_by_user' ];
        continue;
    }

    // 4) Buscar otras reservas donde el reservable tenga el mismo email but non-empty name
    $resAny = Reserva::whereHasMorph('reservable', [\App\Models\Cliente::class, \App\Models\User::class], function($q) use ($email) { $q->where('email', $email)->whereNotNull('name')->where('name', '!=', 'Sin nombre'); })->orderByDesc('id')->first();
    if ($resAny) {
        $reservable = $resAny->reservable;
        if ($reservable && $reservable->name && $reservable->name !== 'Sin nombre') {
            $old = $c->name;
            $c->name = $reservable->name;
            $c->save();
            $updated++;
            $log[] = [ 'id' => $c->id, 'email' => $email, 'from' => $old, 'to' => $c->name, 'source' => 'reservable_record' ];
            continue;
        }
    }

    // Ninguna fuente de nombre encontrada -> skip
    $skipped++;
    $log[] = [ 'id' => $c->id, 'email' => $email, 'from' => $c->name, 'to' => null, 'source' => 'no_match' ];
}

// Resumen
echo "Clientes inspeccionados: " . $clients->count() . "\n";
echo "Actualizados: $updated\n";
echo "Omitidos: $skipped\n";

if (!empty($log)) {
    echo "Detalle de cambios:\n";
    foreach ($log as $l) {
        echo json_encode($l, JSON_UNESCAPED_UNICODE) . "\n";
    }
}
