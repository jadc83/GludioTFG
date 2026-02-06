<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\PaymentService;

$sessionId = $argv[1] ?? null;
if (! $sessionId) { echo "Usage: php scripts/run_check_session_real.php {session_id}\n"; exit(1); }

$svc = new PaymentService();
$res = $svc->checkSession($sessionId);
var_export($res);

echo "\n";

?>
