<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Buscar últimas 3 reservas con cupón
$reservas = \App\Models\Reserva::whereNotNull('cupon_id')
    ->orderBy('id', 'desc')
    ->limit(3)
    ->get();

echo "Últimas reservas con cupón:\n";
foreach ($reservas as $r) {
    echo "\nID: {$r->id}\n";
    echo "Localizador: {$r->localizador}\n";
    echo "Precio total: {$r->precio_total}\n";
    echo "Descuento aplicado: " . ($r->descuento_aplicado ?? 'NULL') . "\n";
    echo "Cupón ID: " . ($r->cupon_id ?? 'NULL') . "\n";
}

// También buscar registros en cupones_aplicados
echo "\n\nÚltimos cupones aplicados:\n";
$cupones_aplicados = \App\Models\CuponAplicado::orderBy('id', 'desc')->limit(3)->get();
foreach ($cupones_aplicados as $ca) {
    echo "\nReserva: {$ca->reserva_id}\n";
    echo "Cupón: {$ca->codigo}\n";
    echo "Descuento: {$ca->descuento_aplicado}\n";
}
