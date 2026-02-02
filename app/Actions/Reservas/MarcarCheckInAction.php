<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Support\Facades\Auth;

/**
 * Action para realizar check-in de una reserva
 * Valida fecha, asigna habitaciones y actualiza estado
 * Usado por: ReservaController::marcarCheckIn(), procesos de recepción
 * Retorna: array con resultado del check-in
 */
class MarcarCheckInAction
{
    protected ReservaService $reservaService;

    /**
     * Constructor con inyección de ReservaService
     */
    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    /**
     * Ejecuta el proceso de check-in
     * Parámetros: localizador de la reserva
     * Valida fecha, asigna habitaciones, actualiza estado
     * Retorna: array con success/message o error details
     */
    public function handle(string $localizador): array
    {
        $reserva = Reserva::where('localizador', $localizador)->firstOrFail();
        $checkInDate = \Carbon\Carbon::parse($reserva->check_in);
        if (!\Carbon\Carbon::today()->isSameDay($checkInDate)) {
            return [
                'success' => false,
                'message' => 'No es el día de check-in para esta reserva. Solo se permite hacer check-in en la fecha de entrada.'
            ];
        }

        $asignaciones = $this->reservaService->asignarHabitacionEnCheckIn($reserva, Auth::id());

        $failed = array_filter($asignaciones, function ($a) { return isset($a['assigned']) && $a['assigned'] === false; });
        if (count($failed) > 0) {
            return ['success' => false, 'message' => 'No se pudieron asignar todas las habitaciones en el check-in. Contacte recepción.', 'details' => $asignaciones];
        }

        $reserva->status = 'en_estancia';
        $reserva->save();

        try { event(new \App\Events\ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }



        return ['success' => true, 'message' => 'Check-in realizado', 'reserva' => [ 'localizador' => $reserva->localizador, 'status' => $reserva->status, 'asignaciones' => $asignaciones ]];
    }
}
