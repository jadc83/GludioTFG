<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Buscar la reserva 29 directamente
$reserva = \App\Models\Reserva::find(29);
echo "Reserva ID 29:\n";
echo "Localizador: " . $reserva->localizador . "\n";
echo "Precio total: " . $reserva->precio_total . "\n";
echo "Descuento aplicado: " . ($reserva->descuento_aplicado ?? 'NULL') . "\n";
echo "Cupón ID: " . ($reserva->cupon_id ?? 'NULL') . "\n";
echo "\nTodos los atributos:\n";
print_r($reserva->toArray());
