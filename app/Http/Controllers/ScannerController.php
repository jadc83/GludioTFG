<?php

namespace App\Http\Controllers;

use App\Events\ReservaActualizada;
use App\Models\Reserva;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ScannerController extends Controller
{
    /**
     * Process a scanned payload from the client.
     * Expected JSON: { localizador: string, action: 'checkin'|'checkout' }
     */
    public function procesar(Request $request)
    {
        $localizador = $request->input('localizador');
        $action = $request->input('action');

        if (!$localizador) {
            return response()->json(['success' => false, 'error' => 'Missing localizador'], 400);
        }

        try {
            $reserva = Reserva::where('localizador', $localizador)->first();
            if (!$reserva) {
                return response()->json(['success' => false, 'error' => 'Reserva no encontrada'], 404);
            }

            if ($action === 'checkin') {
                // Only allow check-in if not already checked_in
                if ($reserva->status === 'checked_in') {
                    return response()->json(['success' => true, 'message' => 'Reserva ya marcada como check-in', 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status]]);
                }

                $reserva->status = 'checked_in';
                $reserva->save();

                try { event(new ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

                return response()->json(['success' => true, 'message' => 'Check-in realizado', 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status]]);
            }

            if ($action === 'checkout') {
                $now = Carbon::now();
                $checkOut = Carbon::parse($reserva->check_out);

                if ($now->startOfDay()->gt($checkOut->endOfDay())) {
                    return response()->json(['success' => false, 'error' => 'No se puede hacer check-out: la fecha de salida ya ha pasado.'], 400);
                }

                if ($reserva->status !== 'checked_in') {
                    return response()->json(['success' => false, 'error' => 'La reserva no está marcada como check-in.'], 400);
                }

                $reserva->status = 'checked_out';
                $reserva->save();

                try { event(new ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

                return response()->json(['success' => true, 'message' => 'Check-out realizado', 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status]]);
            }

            // If no action provided, just return reservation data
            return response()->json(['success' => true, 'reserva' => ['localizador' => $reserva->localizador, 'status' => $reserva->status, 'check_in' => $reserva->check_in, 'check_out' => $reserva->check_out]]);

        } catch (\Exception $e) {
            Log::error('Error en ScannerController::procesar - ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error procesando escaneo: ' . $e->getMessage()], 500);
        }
    }
}
