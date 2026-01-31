<?php
require __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;

$base = 'http://127.0.0.1:8000';
$client = new Client(['base_uri' => $base, 'http_errors' => false]);
$jar = new CookieJar();

try {
    echo "GET / to obtain session and CSRF token...\n";
    $res = $client->get('/', ['cookies' => $jar]);
    $body = (string)$res->getBody();

    // Extract CSRF token from meta tag
    $token = null;
    if (preg_match('/<meta name="csrf-token" content="([^"]+)"/', $body, $m)) {
        $token = $m[1];
    }

    echo "CSRF token: " . ($token ?? 'NOT FOUND') . "\n";

    $payload = [
        'name' => 'HTTP Test Reserva',
        'email' => 'http-test@example.com',
        'telefono' => '622000000',
        'tipo_documento' => 'dni',
        'numero_documento' => 'HTTP12345X',
        'nacionalidad' => 'ES',
        'direccion' => [ 'calle' => 'Calle HTTP 1', 'ciudad' => 'Ciudad', 'codigo_postal' => '12345', 'pais' => 'ES' ],
        'check_in' => date('Y-m-d', strtotime('+10 days')),
        'check_out' => date('Y-m-d', strtotime('+12 days')),
        'habitaciones' => [ ['tipo' => 'doble', 'cantidad' => 1, 'personas_por_habitacion' => 2] ],
        'tarifas' => [],
    ];

    echo "POST /reservas with CSRF and cookies...\n";
    $headers = ['Accept' => 'application/json'];
    if ($token) $headers['X-CSRF-TOKEN'] = $token;

    $post = $client->post('/reservas', [
        'cookies' => $jar,
        'headers' => $headers,
        'json' => $payload,
    ]);

    echo "Status: " . $post->getStatusCode() . "\n";
    echo (string)$post->getBody() . "\n";

} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
