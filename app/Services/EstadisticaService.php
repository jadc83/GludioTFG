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

        $totalPorTipo = Habitacion::all()->countBy('tipo')->toArray();

        foreach ($tipos as $tipo) {
            $totalPorTipo[$tipo] = $totalPorTipo[$tipo] ?? 0;
        }

        $resultados = [];
        $periodo = new \DatePeriod($desde, new \DateInterval('P1D'), $hasta->copy()->addDay());

        foreach ($periodo as $dia) {
            $fecha = $dia->format('Y-m-d');

            $conteo = ContarPorTipoAction::handle($fecha);

            $asignadasPorTipo = $conteo['asignadasPorTipo'] ?? [];
            $placeholdersPorTipo = $conteo['placeholdersPorTipo'] ?? [];
            $reservasSinHabitacion = $conteo['reservasSinHabitacion'] ?? 0;

            $diaFormateado = FormatearPorDiaAction::handle($fecha, $asignadasPorTipo, $placeholdersPorTipo, $totalPorTipo, $totalHabitaciones);
            $diaFormateado['ocupadas'] += $reservasSinHabitacion;
            $diaFormateado['porcentaje_ocupacion'] = $totalHabitaciones > 0 ? round(($diaFormateado['ocupadas'] / $totalHabitaciones) * 100, 2) : 0;

            $resultados[] = $diaFormateado;
        }

        $promedio = 0;
        if (!empty($resultados)) {
            $promedio = round(array_sum(array_column($resultados, 'porcentaje_ocupacion')) / count($resultados), 2);
        }

        $promedioPorTipo = [];
        if (!empty($resultados)) {
            foreach ($tipos as $tipo) {
                $suma = 0;
                foreach ($resultados as $r) {
                    $suma += $r['por_tipo'][$tipo]['porcentaje'];
                }
                $promedioPorTipo[$tipo] = round($suma / count($resultados), 2);
            }
        } else {
            foreach ($tipos as $tipo) $promedioPorTipo[$tipo] = 0;
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
