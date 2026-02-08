<?php
// Uso: php scripts/run_approve_refund_request.php <refund_request_id>
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RefundRequest;
use App\Http\Controllers\RefundRequestController;
use Illuminate\Support\Facades\Auth;

$rrId = $argv[1] ?? null;
if (! $rrId) {
    echo "Uso: php scripts/run_approve_refund_request.php <refund_request_id>\n";
    exit(1);
}

$rr = RefundRequest::find($rrId);
if (! $rr) {
    echo "RefundRequest {$rrId} no encontrado\n";
    exit(1);
}

// Crear un usuario admin en runtime y setearlo como Auth::user()
$admin = \App\Models\User::whereHas('roles', function($q){ $q->where('name','admin'); })->first();
if (! $admin) {
    // fallback: coger primer usuario
    $admin = \App\Models\User::first();
}

if (! $admin) {
    echo "No hay usuarios disponibles para autenticar como admin.\n";
    exit(1);
}

// Forzar rol admin if necessary (only for script runtime)
try {
    Auth::login($admin);
} catch (Throwable $e) {
    // ignore
}

$controller = new RefundRequestController(app(\App\Services\RefundService::class));
$request = new \Illuminate\Http\Request();

// call approve and capture response
$response = $controller->approve($request, $rr, app(\App\Services\PaymentService::class), app(\App\Services\PrecioService::class));

echo "Approve response:\n";
print_r($response->getContent());

// Mostrar estado actualizado
$rrFresh = RefundRequest::find($rrId);
print_r($rrFresh->toArray());

echo "Done.\n";
