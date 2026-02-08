<?php

namespace App\Actions\Reservas;

use App\Services\HabitacionService;
use Carbon\Carbon;

class HabitacionesDisponiblesAction
{
    protected HabitacionService $habitacionService;

    public function __construct(HabitacionService $habitacionService)
    {
        $this->habitacionService = $habitacionService;
    }

    public function handle(array $data)
    {
        $entrada = Carbon::parse($data['check_in']);
        $salida = Carbon::parse($data['check_out']);

        if (!$entrada || !$salida) {
            return ['success' => false, 'error' => 'Fechas inválidas'];
        }

        $excluirReservaId = $data['reserva_id'] ?? null;
        // Support passing localizador instead of id for convenience
        if (!$excluirReservaId && !empty($data['localizador'])) {
            $r = \App\Models\Reserva::where('localizador', $data['localizador'])->first();
            if ($r) $excluirReservaId = $r->id;
        }

        $disponibles = $this->habitacionService->getDisponibles($entrada, $salida, false, $excluirReservaId);

        // If debug requested, also return internal counts comparing with and without exclusion
        if (!empty($data['debug'])) {
            $sinExclusion = $this->habitacionService->getDisponibles($entrada, $salida, true, null);
            $conExclusion = $this->habitacionService->getDisponibles($entrada, $salida, true, $excluirReservaId);
            return ['success' => true, 'data' => $disponibles, 'debug' => ['sin_exclusion' => $sinExclusion, 'con_exclusion' => $conExclusion, 'excluir_reserva_id' => $excluirReservaId]];
        }

        return ['success' => true, 'data' => $disponibles];
    }
}
