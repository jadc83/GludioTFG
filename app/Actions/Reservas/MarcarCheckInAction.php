<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MarcarCheckInAction
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function handle(string $localizador): array
    {
        $reserva = Reserva::where('localizador', $localizador)->firstOrFail();

        // No permitir hacer check-in antes del día de entrada
        $checkInDate = \Carbon\Carbon::parse($reserva->check_in);
        if (!\Carbon\Carbon::today()->isSameDay($checkInDate)) {
            return [
                'success' => false,
                'message' => 'No es el día de check-in para esta reserva. Solo se permite hacer check-in en la fecha de entrada.'
            ];
        }

        // Intentar asignar habitaciones concretas en check-in
        $asignaciones = $this->reservaService->asignarHabitacionEnCheckIn($reserva, Auth::id());

        $failed = array_filter($asignaciones, function ($a) { return isset($a['assigned']) && $a['assigned'] === false; });
        if (count($failed) > 0) {
            return ['success' => false, 'message' => 'No se pudieron asignar todas las habitaciones en el check-in. Contacte recepción.', 'details' => $asignaciones];
        }

        $reserva->status = 'checked_in';
        $reserva->save();

        try { event(new \App\Events\ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }



        return ['success' => true, 'message' => 'Check-in realizado', 'reserva' => [ 'localizador' => $reserva->localizador, 'status' => $reserva->status, 'asignaciones' => $asignaciones ]];
    }
}
