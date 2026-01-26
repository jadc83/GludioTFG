<?php

namespace App\Actions\Reservas;

use App\Services\PrecioService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PreciosPorDiaAction
{
    protected PrecioService $precioService;

    public function __construct(PrecioService $precioService)
    {
        $this->precioService = $precioService;
    }

    public function handle(array $params)
    {
        try {
            $inicio = $params['inicio'] ?? null;
            $fin = $params['fin'] ?? null;
            $fechaInicio = $inicio ? Carbon::createFromFormat('Y-m-d', $inicio) : Carbon::today();
            $fechaFin = $fin ? Carbon::createFromFormat('Y-m-d', $fin) : Carbon::today()->addDays(90);

            if ($fechaFin->lt($fechaInicio)) {
                return ['success' => false, 'error' => 'Rango de fechas inválido'];
            }

            $resultados = $this->precioService->preciosPorRango($fechaInicio, $fechaFin);
            return ['success' => true, 'data' => $resultados];
        } catch (\Exception $e) {
            Log::error('Error en PreciosPorDiaAction: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Error calculando precios'];
        }
    }
}
