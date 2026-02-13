<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

echo "Starting E2E guest reservation flow test...\n";

// Construye payload para storeConCheckout (usar metodo_pago='recepcion' para evitar Stripe)
$tomorrow = (new DateTime('+1 day'))->format('Y-m-d');
$dayAfter = (new DateTime('+2 days'))->format('Y-m-d');

$payload = [
    'check_in' => $tomorrow,
    'check_out' => $dayAfter,
    'name' => 'E2E Test Guest',
    'email' => 'e2e-guest+test@example.com',
    'telefono' => '600000000',
    'habitaciones' => [ ['tipo' => 'doble', 'cantidad' => 1] ],
    'metodo_pago' => 'recepcion',
    'monto' => 0,
];

echo "Calling ReservaController::storeConCheckout...\n";

// Create reservation using the CreateReservaAction directly (bypass HTTP/CSRF)
$action = app(\App\Actions\Reservas\CreateReservaAction::class);
$result = $action->handle($payload, null, 'pendiente');

echo "Action result keys: " . implode(',', array_keys($result)) . "\n";

$localizador = $result['localizador'] ?? null;
$reserva_id = $result['reserva_id'] ?? null;

if (! $localizador) {
    echo "Could not obtain localizador from response; aborting further checks.\n";
    exit(1);
}

echo "Created reserva localizador={$localizador}, id={$reserva_id}\n";

// Simulate payment: create Pago and mark reserva as pagado
try {
    DB::transaction(function() use ($reserva_id) {
        $reserva = \App\Models\Reserva::find($reserva_id);
        if (! $reserva) throw new \RuntimeException('Reserva not found');

        // Create Pago
        $pago = \App\Models\Pago::create([
            'reserva_id' => $reserva->id,
            'monto' => $reserva->precio_total ?? 0,
            'moneda' => 'eur',
            'estado' => 'completado',
            'descripcion' => 'E2E simulated pago',
            'stripe_response' => [],
        ]);

        $reserva->update(['pago' => 'pagado']);
        echo "Simulated pago created id={$pago->id}\n";
    });
} catch (\Throwable $e) {
    echo "Error simulating pago: " . $e->getMessage() . "\n";
    exit(1);
}

// Call ReservaController::show directly and capture result (avoid kernel since it may trigger console renderer)
try {
    $reservaModel = \App\Models\Reserva::find($reserva_id);
    if (! $reservaModel) throw new \RuntimeException('Reserva model not found for show');

    $controller = app()->make(\App\Http\Controllers\ReservaController::class);
    $result = $controller->show($reservaModel);

    echo "Controller show returned type: " . (is_object($result) ? get_class($result) : gettype($result)) . "\n";

    // If it's an Inertia response, try to extract props array
    if (is_object($result) && method_exists($result, 'toResponse')) {
        try {
            $httpResp = $result->toResponse(request());
            echo "toResponse status: " . $httpResp->getStatusCode() . "\n";
            echo "toResponse content (truncated):\n" . substr((string)$httpResp->getContent(), 0, 1200) . "\n";
        } catch (\Throwable $e) {
            echo "Error calling toResponse on Inertia result: " . $e->getMessage() . "\n";
        }
    } else {
        // Dump generic result
        echo "Show result dump: ";
        ob_start();
        var_dump($result);
        $dump = ob_get_clean();
        echo substr($dump, 0, 1200) . "\n";
    }
} catch (\Throwable $e) {
    echo "Exception when calling controller->show: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

echo "E2E guest reservation flow test complete.\n";
