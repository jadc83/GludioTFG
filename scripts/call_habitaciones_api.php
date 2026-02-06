<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;

$req = Request::create('/habitaciones?estado=limpieza', 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest']);
$resp = app()->handle($req);

echo "Status: " . $resp->getStatusCode() . "\n";
$content = $resp->getContent();

// Try to pretty print JSON
$json = json_decode($content, true);
if (json_last_error() === JSON_ERROR_NONE) {
    echo json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
} else {
    echo $content . PHP_EOL;
}
