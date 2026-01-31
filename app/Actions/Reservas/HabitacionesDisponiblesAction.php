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

        $disponibles = $this->habitacionService->getDisponibles($entrada, $salida);
        return ['success' => true, 'data' => $disponibles];
    }
}
