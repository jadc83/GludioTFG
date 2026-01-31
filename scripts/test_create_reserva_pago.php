<?php
// Script de prueba: Crear reserva y (si procede) simular pago
// Uso: php scripts/test_create_reserva_pago.php

require __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;

$base = 'http://127.0.0.1:8000';
$client = new Client(['base_uri' => $base, 'http_errors' => false]);

$payload = [
    'name' => 'Prueba Reserva',
    'email' => 'test@example.com',
    'telefono' => '600000000',
    'tipo_documento' => 'dni',
    'numero_documento' => 'T1234567X',
    'nacionalidad' => 'ES',
    'direccion' => [
        'calle' => 'Calle Test 1',
        'ciudad' => 'Ciudad',
        'codigo_postal' => '00000',
        'pais' => 'ES'
    ],
    'check_in' => date('Y-m-d', strtotime('+7 days')),
    'check_out' => date('Y-m-d', strtotime('+9 days')),
    'habitaciones' => [
        ['tipo' => 'doble', 'cantidad' => 1, 'personas_por_habitacion' => 2]
    ],
    'tarifas' => [],
];

echo "-> Enviando petición de creación de reserva al endpoint /reservas\n";
try {
    $res = $client->post('/reservas', [ 'json' => $payload ]);
} catch (\Exception $e) {
    echo "Error de conexión: " . $e->getMessage() . "\n";
    exit(1);
}

$code = $res->getStatusCode();
$body = (string)$res->getBody();

echo "Respuesta status: $code\n";
echo "Cuerpo:\n" . $body . "\n";

$json = json_decode($body, true);
if (!is_array($json)) {
    echo "Respuesta no JSON. Fin.\n";
    exit(0);
}

if (($json['success'] ?? false) === true) {
    echo "Reserva creada: localizador=" . ($json['localizador'] ?? 'N/D') . " reserva_id=" . ($json['reserva_id'] ?? 'N/D') . "\n";
    $reservaId = $json['reserva_id'] ?? null;
    if ($reservaId) {
        echo "-> Intentando endpoint de pago simulado /reservas/{$reservaId}/pagar (POST)\n";
        try {
            $pay = $client->post("/reservas/{$reservaId}/pagar", [ 'json' => ['metodo' => 'test', 'monto' => 0] ]);
            echo "Pago status: " . $pay->getStatusCode() . "\n";
            echo (string)$pay->getBody() . "\n";
        } catch (\Exception $e) {
            echo "Error al llamar endpoint pago: " . $e->getMessage() . "\n";
        }
    }
    exit(0);
}

// Error
if (isset($json['error'])) {
    echo "Error desde API: " . $json['error'] . "\n";
}
if (isset($json['debug'])) {
    echo "Debug: " . $json['debug'] . "\n";
}

exit(0);
