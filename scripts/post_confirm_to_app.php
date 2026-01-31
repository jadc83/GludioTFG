<?php
require __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;

$base = 'http://127.0.0.1:8000';
$client = new Client(['base_uri' => $base, 'http_errors' => false]);
$jar = new CookieJar();

try {
	echo "GET / para obtener CSRF...\n";
	$res = $client->get('/', ['cookies' => $jar]);
	$body = (string)$res->getBody();
	$token = null;
	if (preg_match('/<meta name="csrf-token" content="([^"]+)"/', $body, $m)) { $token = $m[1]; }
	echo "CSRF: " . ($token ?? 'NOT FOUND') . "\n";

	$paymentIntentId = $argv[1] ?? null;
	$pagoId = $argv[2] ?? null;
	if (! $paymentIntentId || ! $pagoId) { echo "Usage: php post_confirm_to_app.php {payment_intent_id} {pago_id}\n"; exit(1); }

	$headers = ['Accept' => 'application/json'];
	if ($token) $headers['X-CSRF-TOKEN'] = $token;

	$post = $client->post('/pagos/confirmar', [
		'cookies' => $jar,
		'headers' => $headers,
		'json' => ['payment_intent_id' => $paymentIntentId, 'pago_id' => $pagoId],
	]);

	echo "Status: " . $post->getStatusCode() . "\n";
	echo (string)$post->getBody() . "\n";
} catch (\Exception $e) {
	echo "Exception: " . $e->getMessage() . "\n";
}
