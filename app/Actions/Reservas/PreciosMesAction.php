<?php

namespace App\Actions\Reservas;

use App\Services\PrecioService;
use Illuminate\Support\Facades\Log;

class PreciosMesAction
{
    protected PrecioService $precioService;

    public function __construct(PrecioService $precioService)
    {
        $this->precioService = $precioService;
    }

    public function handle(int $yyyy, int $mm)
    {
        try {
            $anio = (int) $yyyy;
            $mes = (int) $mm;

            if (!checkdate($mes, 1, $anio)) {
                return ['success' => false, 'error' => 'Fecha inválida'];
            }

            $resultados = $this->precioService->preciosMes($anio, $mes);
            return ['success' => true, 'data' => $resultados];
        } catch (\Exception $e) {
            Log::error('Error en PreciosMesAction: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Error calculando precios por mes'];
        }
    }
}
