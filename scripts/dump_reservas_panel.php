<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Services\ReservaService;

// Usar la misma query que PanelController
$reservas = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
    ->orderBy('check_in', 'desc')
    ->get();

$service = app(ReservaService::class);
$formateadas = $service->formatearReservas($reservas);

// Añadir detalles adicionales por inspección
foreach ($formateadas as &$f) {
    $r = Reserva::where('localizador', $f['localizador'])->with('pagos')->first();
    $f['pagos_detalle'] = $r->pagos->map(function($p) {
        return [
            'id' => $p->id,
            'monto' => (float) $p->monto,
            'estado' => $p->estado,
            'stripe_payment_intent_id' => $p->stripe_payment_intent_id ?? null,
            'stripe_checkout_session_id' => $p->stripe_checkout_session_id ?? null,
            'pagado_en' => $p->pagado_en?->toDateTimeString() ?? null,
        ];
    })->toArray();
}

echo json_encode(['count' => count($formateadas), 'reservas' => $formateadas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
