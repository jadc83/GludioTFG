<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Actions\Reservas\HabitacionesDisponiblesAction;
use Carbon\Carbon;

$localizador = $argv[1] ?? null;
if (! $localizador) { echo "Usage: php scripts/preview_extend.php {localizador}\n"; exit(1); }

$reserva = Reserva::with(['habitaciones'])->where('localizador', $localizador)->first();
if (! $reserva) { echo "Reserva {$localizador} no encontrada\n"; exit(1); }

$originalCheckIn = Carbon::parse($reserva->check_in);
$originalCheckOut = Carbon::parse($reserva->check_out);
$newCheckOut = $originalCheckOut->copy()->addDay();

$action = app(HabitacionesDisponiblesAction::class);
$params = ['check_in' => $originalCheckIn->format('Y-m-d'), 'check_out' => $newCheckOut->format('Y-m-d')];
$dispResult = $action->handle($params);

if (empty($dispResult['success'])) {
    echo json_encode(['success' => false, 'error' => $dispResult['error'] ?? 'unknown'], JSON_PRETTY_PRINT) . "\n";
    exit(0);
}

$grupos = $dispResult['data'] ?? [];

// Map grupos by tipo
$map = [];
foreach ($grupos as $g) {
    $map[$g['tipo']] = $g;
}

$nuevoTotal = 0.0;
foreach ($reserva->habitaciones as $hr) {
    $tipo = $hr->tipo ?? ($hr->habitacion?->tipo ?? null);
    if ($tipo && isset($map[$tipo])) {
        $nuevoTotal += floatval($map[$tipo]['precioTotal'] ?? 0);
    } else {
        // tipo no encontrado -> marcar no disponible
        echo json_encode(['success' => false, 'available' => false, 'message' => "Tipo {$tipo} no disponible en nuevos rangos"], JSON_PRETTY_PRINT) . "\n";
        exit(0);
    }
}

$viejoTotal = floatval($reserva->precio_total ?? 0);
$nightsOld = $originalCheckIn->diffInDays($originalCheckOut);
$nightsNew = $originalCheckIn->diffInDays($newCheckOut);
$delta = round(($nuevoTotal - $viejoTotal) * 100) / 100;
$penalizacion = 20.0;
$estimateRefund = 0.0;
$estimateCharge = 0.0;
if ($delta < 0) {
    $rawRefund = round(($viejoTotal - $nuevoTotal) * 100) / 100;
    $estimateRefund = max(0, round(($rawRefund - $penalizacion) * 100) / 100);
} else {
    $estimateCharge = round($delta * 100) / 100;
}

$extraNights = max(0, $nightsNew - $nightsOld);
$removedNights = max(0, $nightsOld - $nightsNew);
$perNightChange = 0;
$perNightNet = 0;
if ($extraNights > 0) {
    $perNightChange = $extraNights > 0 ? round((($nuevoTotal - $viejoTotal) / $extraNights) * 100) / 100 : 0;
    $perNightNet = $perNightChange;
} elseif ($removedNights > 0) {
    $perNightChange = $removedNights > 0 ? round((($viejoTotal - $nuevoTotal) / $removedNights) * 100) / 100 : 0;
    $penalPerNight = $removedNights > 0 ? round(($penalizacion / $removedNights) * 100) / 100 : 0;
    $perNightNet = max(0, round(($perNightChange - $penalPerNight) * 100) / 100);
}

$out = [
    'success' => true,
    'localizador' => $localizador,
    'original' => [ 'check_in' => $originalCheckIn->format('Y-m-d'), 'check_out' => $originalCheckOut->format('Y-m-d'), 'precio_total' => $viejoTotal, 'nights' => $nightsOld ],
    'propuesta' => [ 'check_in' => $originalCheckIn->format('Y-m-d'), 'check_out' => $newCheckOut->format('Y-m-d'), 'nuevo_total' => round($nuevoTotal * 100) / 100, 'nights' => $nightsNew ],
    'delta' => $delta,
    'estimate_refund' => $estimateRefund,
    'estimate_charge' => $estimateCharge,
    'penalizacion' => $penalizacion,
    'extra_nights' => $extraNights,
    'removed_nights' => $removedNights,
    'per_night_change' => $perNightChange,
    'per_night_net' => $perNightNet,
    'available' => true,
    'raw_grupos' => $grupos,
];

echo json_encode($out, JSON_PRETTY_PRINT) . "\n";

exit(0);
