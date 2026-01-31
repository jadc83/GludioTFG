<?php

namespace App\Actions\Reservas;

use App\Services\PrecioService;
use App\Services\EstadisticaService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Action para obtener precios y ocupación por día
 * Combina datos de precios y estadísticas de ocupación para calendario
 * Usado por: ReservaController::preciosPorDia(), calendario de reservas
 * Retorna: array con precios y ocupación diaria o error
 */
class PreciosPorDiaAction
{
    protected PrecioService $precioService;
    protected EstadisticaService $estadisticaService;

    /**
     * Constructor con inyección de dependencias
     * Servicios: PrecioService, EstadisticaService
     */
    public function __construct(PrecioService $precioService, EstadisticaService $estadisticaService)
    {
        $this->precioService = $precioService;
        $this->estadisticaService = $estadisticaService;
    }

    /**
     * Ejecuta la lógica principal del action
     * Parámetros: array con 'inicio' y 'fin' (fechas YYYY-MM-DD)
     * Procesa: obtiene precios y ocupación, combina resultados
     * Retorna: array con success/data o success/error
     */
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

            $precios = $this->precioService->diaPrecio($fechaInicio, $fechaFin);
            $ocupacionData = $this->estadisticaService->calcularOcupacion($fechaInicio, $fechaFin);

            // Combinar precios y ocupación
            $resultados = [];
            foreach ($precios as $fecha => $precio) {
                $diaOcupacion = collect($ocupacionData['por_dia'])->firstWhere('fecha', $fecha);
                $resultados[$fecha] = [
                    'precio' => $precio,
                    'ocupacion' => $diaOcupacion ? $diaOcupacion['porcentaje_ocupacion'] : 0,
                ];
            }

            return ['success' => true, 'data' => $resultados];
        } catch (\Exception $e) {
            Log::error('Error en PreciosPorDiaAction: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Error calculando precios y ocupación'];
        }
    }
}
