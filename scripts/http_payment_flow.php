<?php
require __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;

$base = 'http://127.0.0.1:8000';
$client = new Client(['base_uri' => $base, 'http_errors' => false]);
$jar = new CookieJar();

// Bootstrap Laravel for DB access
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;
use App\Models\Reserva;

$reservaId = $argv[1] ?? 462;
$reserva = Reserva::find($reservaId);
if (! $reserva) { echo "Reserva {$reservaId} no encontrada\n"; exit(1); }

try {
    echo "GET / to obtain CSRF token...\n";
    $res = $client->get('/', ['cookies' => $jar]);
    $body = (string)$res->getBody();
    $token = null;
    if (preg_match('/<meta name="csrf-token" content="([^"]+)"/', $body, $m)) {
        $token = $m[1];
    }
    echo "CSRF token: " . ($token ?? 'NOT FOUND') . "\n";

    $payload = [
        'reserva_id' => (int)$reserva->id,
        'monto' => (float)$reserva->precio_total,
        // pedir confirmación automática en entornos de prueba
        'confirm_with_pm' => true,
    ];

    echo "POST /pagos/crear-payment-intent -> reserva_id={$reserva->id} monto={$reserva->precio_total}\n";
    $headers = ['Accept' => 'application/json'];
    if ($token) $headers['X-CSRF-TOKEN'] = $token;

    $post = $client->post('/pagos/crear-payment-intent', [
        'cookies' => $jar,
        'headers' => $headers,
        'json' => $payload,
    ]);

    echo "Status crearPaymentIntent: " . $post->getStatusCode() . "\n";
    $resp = json_decode((string)$post->getBody(), true);
    print_r($resp);

    if (!($resp['success'] ?? false)) {
        echo "crearPaymentIntent failed\n";
        exit(1);
    }

    $pagoId = $resp['pago_id'] ?? null;
    if (! $pagoId) { echo "No pago_id returned\n"; exit(1); }

    // Load Pago from DB to get stripe_payment_intent_id
    $pago = Pago::find($pagoId);
    if (! $pago) { echo "Pago {$pagoId} no encontrado en DB\n"; exit(1); }

    $stripeIntentId = $pago->stripe_payment_intent_id ?? null;
    echo "Pago creado id={$pagoId} stripe_intent_id={$stripeIntentId}\n";

    if (! $stripeIntentId) {
        echo "No stripe intent id, cannot confirm.\n";
        exit(0);
    }

    echo "POST /pagos/confirmar con payment_intent_id={$stripeIntentId} pago_id={$pagoId}\n";
    $confirm = $client->post('/pagos/confirmar', [
        'cookies' => $jar,
        'headers' => $headers,
        'json' => ['payment_intent_id' => $stripeIntentId, 'pago_id' => $pagoId],
    ]);

    echo "Status confirmarPago: " . $confirm->getStatusCode() . "\n";
    echo (string)$confirm->getBody() . "\n";

} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
