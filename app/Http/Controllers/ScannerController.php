<?php

namespace App\Http\Controllers;

use App\Events\ReservaActualizada;
use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ScannerController extends Controller
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function procesar(Request $request)
    {
        $localizador = $request->input('localizador');
        $accion = $request->input('accion');

        if (!$localizador) {
            return response()->json(['success' => false, 'error' => 'Localizador no encontrado'], 400);
        }

        try {
            $reserva = Reserva::where('localizador', $localizador)->first();
            if (!$reserva) {
                return response()->json(['success' => false, 'error' => 'Reserva no encontrada'], 404);
            }

            if ($accion === 'checkin') {
                // Hacer check-in solo si no se hizo ya
                if ($reserva->status === 'checked_in') {
                    return response()->json(['success' => true, 'message' => 'Reserva ya marcada como check-in', 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status]]);
                }

                // Asignar habitaciones
                try {
                    $asignaciones = $this->reservaService->asignarHabitacionEnCheckIn($reserva, Auth::id());
                    $fallos = array_filter($asignaciones, function($a){ return isset($a['assigned']) && $a['assigned'] === false; });
                    if (count($fallos) > 0) {
                        $fallos = count($fallos);
                        $total = count($asignaciones);
                        return response()->json([
                            'success' => false,
                            'message' => "No se pudieron asignar {$fallos} de {$total} habitaciones en el check-in. Contacte recepción.",
                            'details' => $asignaciones,
                            'failed_count' => $fallos
                        ], 409);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Error asignando habitaciones via scanner: ' . $e->getMessage());
                    return response()->json([ 'success' => false, 'error' => 'Error al asignar habitaciones en check-in: ' . $e->getMessage() ], 500);
                }

                $reserva->status = 'checked_in';
                $reserva->save();

                try { event(new ReservaActualizada($reserva, null)); } catch (\Throwable $e) { /* ignore */ }

                return response()->json(['success' => true, 'message' => 'Check-in realizado', 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status]]);
            }

            if ($accion === 'checkout') {
                $ahora = Carbon::now();
                $checkOut = Carbon::parse($reserva->check_out);

                if ($ahora->startOfDay()->gt($checkOut->endOfDay())) {
                    return response()->json(['success' => false, 'error' => 'No se puede hacer check-out, la fecha de salida ya ha pasado.'], 400);
                }

                if ($reserva->status !== 'checked_in') {
                    return response()->json(['success' => false, 'error' => 'La reserva no está marcada como check-in.'], 400);
                }

                $reserva->status = 'checked_out';
                $reserva->save();

                // Marcar las habitaciones asignadas como 'limpieza' para que recepción/protocolos las procesen
                try {
                    foreach ($reserva->habitaciones()->whereNotNull('habitacion_id')->get() as $hr) {
                        $habitacion = $hr->habitacion;
                        if ($habitacion) {
                            try {
                                $habitacion->update(['estado' => 'limpieza']);
                            } catch (\Throwable $e) {
                                Log::warning('No se pudo actualizar estado de habitación tras checkout (habitacion_id=' . ($habitacion->id ?? 'n/a') . '): ' . $e->getMessage());
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Error marcando habitaciones como limpieza en checkout: ' . $e->getMessage());
                }

                try { event(new ReservaActualizada($reserva, null)); } catch (\Throwable $e) { /* ignorar */ }

                return response()->json(['success' => true, 'message' => 'Check-out realizado', 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status]]);
            }

            return response()->json(['success' => true, 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status, 'check_in' => $reserva->check_in, 'check_out' => $reserva->check_out]]);

        } catch (\Exception $e) {
            Log::error('Error en ScannerController::procesar - ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error procesando escaneo: ' . $e->getMessage()], 500);
        }
    }
}
