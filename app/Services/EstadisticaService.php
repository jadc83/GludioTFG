<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Habitacion;
use App\Actions\Estadisticas\ContarPorTipoAction;
use App\Actions\Estadisticas\FormatearPorDiaAction;

class EstadisticaService
{

    public function calcularOcupacion(Carbon $desde, Carbon $hasta): array
    {
        $totalHabitaciones = Habitacion::count();

        $tipos = ['doble', 'familiar', 'suite'];

        $totalPorTipo = Habitacion::select('tipo', DB::raw('count(*) as cnt'))
            ->groupBy('tipo')
            ->pluck('cnt', 'tipo')
            ->toArray();

        foreach ($tipos as $t) {
            $totalPorTipo[$t] = $totalPorTipo[$t] ?? 0;
        }

        $resultados = [];
        $periodo = new \DatePeriod($desde, new \DateInterval('P1D'), $hasta->copy()->addDay());

        foreach ($periodo as $dia) {
            $fecha = $dia->format('Y-m-d');

            $counts = ContarPorTipoAction::handle($fecha);

            $asignadasPorTipo = $counts['asignadasPorTipo'] ?? [];
            $placeholdersPorTipo = $counts['placeholdersPorTipo'] ?? [];
            $reservasSinHabitaciones = $counts['reservasSinHabitaciones'] ?? 0;

            $diaFormateado = FormatearPorDiaAction::handle($fecha, $asignadasPorTipo, $placeholdersPorTipo, $totalPorTipo, $totalHabitaciones);
            $diaFormateado['ocupadas'] += $reservasSinHabitaciones;
            $diaFormateado['porcentaje_ocupacion'] = $totalHabitaciones > 0 ? round(($diaFormateado['ocupadas'] / $totalHabitaciones) * 100, 2) : 0;

            $resultados[] = $diaFormateado;
        }

        $promedio = 0;
        if (!empty($resultados)) {
            $promedio = round(array_sum(array_column($resultados, 'porcentaje_ocupacion')) / count($resultados), 2);
        }

        $promedioPorTipo = [];
        if (!empty($resultados)) {
            foreach ($tipos as $t) {
                $suma = 0;
                foreach ($resultados as $r) {
                    $suma += $r['por_tipo'][$t]['porcentaje'];
                }
                $promedioPorTipo[$t] = round($suma / count($resultados), 2);
            }
        } else {
            foreach ($tipos as $t) $promedioPorTipo[$t] = 0;
        }

        return [
            'total_habitaciones' => $totalHabitaciones,
            'total_por_tipo' => $totalPorTipo,
            'por_dia' => $resultados,
            'promedio_porcentaje_ocupacion' => $promedio,
            'promedio_porcentaje_ocupacion_por_tipo' => $promedioPorTipo,
        ];
    }
}
