<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Reserva;
use App\Models\Cupon;

// Buscar reserva
$reserva = Reserva::where('localizador', 'GR72X37')->first();

if ($reserva) {
    echo "=== RESERVA GR72X37 ===\n";
    echo "Precio Total: €" . number_format($reserva->precio_total, 2) . "\n";
    echo "Cupon ID: " . ($reserva->cupon_id ?: 'NULL') . "\n";
    echo "Descuento Aplicado: €" . number_format($reserva->descuento_aplicado, 2) . "\n";
    echo "Precio Final: €" . number_format($reserva->precio_total - $reserva->descuento_aplicado, 2) . "\n";

    if ($reserva->cupon_id) {
        $cupon = Cupon::find($reserva->cupon_id);
        if ($cupon) {
            echo "\n=== CUPON APLICADO ===\n";
            echo "Código: " . $cupon->codigo . "\n";
            echo "Tipo: " . $cupon->tipo . "\n";
            echo "Valor: " . $cupon->valor . "\n";

            // Calcular descuento esperado
            $descuentoEsperado = $cupon->tipo === 'porcentaje'
                ? ($reserva->precio_total * $cupon->valor / 100)
                : $cupon->valor;

            echo "Descuento Esperado: €" . number_format($descuentoEsperado, 2) . "\n";
            echo "Descuento Real: €" . number_format($reserva->descuento_aplicado, 2) . "\n";
            echo "¿Correcto?: " . (abs($descuentoEsperado - $reserva->descuento_aplicado) < 0.01 ? 'SÍ ✓' : 'NO ✗') . "\n";
        }
    }
} else {
    echo "No se encontró reserva GR72X37\n";
}
