<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MarcarCheckOutAction
{
    public function handle(string $localizador): array
    {
        $reserva = Reserva::where('localizador', $localizador)->firstOrFail();

        $now = Carbon::now();
        $checkOut = Carbon::parse($reserva->check_out);

        if ($now->startOfDay()->gt($checkOut->endOfDay())) {
            return [ 'success' => false, 'error' => 'No se puede hacer check-out: la fecha de salida ya ha pasado.' ];
        }

        if ($reserva->status !== 'checked_in') {
            return [ 'success' => false, 'error' => 'La reserva no está marcada como check-in.' ];
        }

        $reserva->status = 'checked_out';
        $reserva->save();

        // Cambiar el estado de las habitaciones relacionadas a 'limpieza'
        $this->marcarHabitacionesParaLimpieza($reserva);

        try { event(new \App\Events\ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

        return [ 'success' => true, 'message' => 'Check-out realizado', 'reserva' => [ 'localizador' => $reserva->localizador, 'status' => $reserva->status ] ];
    }

    /**
     * Marca las habitaciones relacionadas con la reserva como 'limpieza'
     */
    private function marcarHabitacionesParaLimpieza(Reserva $reserva): void
    {
        try {
            // Obtener todas las habitaciones asignadas a esta reserva
            $habitacionesReservadas = HabitacionReserva::where('reserva_id', $reserva->id)
                ->whereNotNull('habitacion_id')
                ->with('habitacion')
                ->get();

            $habitacionesActualizadas = 0;

            foreach ($habitacionesReservadas as $habitacionReserva) {
                if ($habitacionReserva->habitacion) {
                    $habitacionReserva->habitacion->estado = 'limpieza';
                    $habitacionReserva->habitacion->save();
                    $habitacionesActualizadas++;

                    Log::info('Habitación marcada para limpieza después de checkout', [
                        'reserva_id' => $reserva->id,
                        'localizador' => $reserva->localizador,
                        'habitacion_id' => $habitacionReserva->habitacion_id,
                        'numero_habitacion' => $habitacionReserva->habitacion->numero
                    ]);
                }
            }

            if ($habitacionesActualizadas > 0) {
                Log::info('Checkout completado: habitaciones marcadas para limpieza', [
                    'reserva_id' => $reserva->id,
                    'localizador' => $reserva->localizador,
                    'habitaciones_actualizadas' => $habitacionesActualizadas
                ]);
            }

        } catch (\Throwable $e) {
            Log::error('Error al marcar habitaciones para limpieza en checkout', [
                'reserva_id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'error' => $e->getMessage()
            ]);

            // No lanzamos la excepción para no interrumpir el checkout,
            // pero registramos el error para seguimiento
        }
    }
}
