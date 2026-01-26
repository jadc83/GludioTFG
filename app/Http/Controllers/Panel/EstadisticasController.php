<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EstadisticasController extends Controller
{
    /**
     * Retorna estadísticas de ocupación para una fecha o un rango de fechas.
     * Parámetros: fecha_desde (Y-m-d), fecha_hasta (Y-m-d)
     */
    public function ocupacion(Request $request)
    {
        $validados = $request->validate([
            'fecha_desde' => 'nullable|date_format:Y-m-d',
            'fecha_hasta' => 'nullable|date_format:Y-m-d',
        ]);

        $fechaDesde = $validados['fecha_desde'] ?? null;
        $fechaHasta = $validados['fecha_hasta'] ?? null;

        if (! $fechaDesde && ! $fechaHasta) {
            $fechaDesde = Carbon::now()->format('Y-m-d');
            $fechaHasta = $fechaDesde;
        } elseif ($fechaDesde && ! $fechaHasta) {
            $fechaHasta = $fechaDesde;
        } elseif (! $fechaDesde && $fechaHasta) {
            $fechaDesde = $fechaHasta;
        }

        $desde = Carbon::parse($fechaDesde);
        $hasta = Carbon::parse($fechaHasta);

        if ($hasta->lessThan($desde)) {
            // intercambiar
            [$desde, $hasta] = [$hasta, $desde];
        }

        $totalHabitaciones = \App\Models\Habitacion::count();

        // tipos que nos interesan (en este orden para el gráfico)
        $tipos = ['doble', 'familiar', 'suite'];

        // total de habitaciones por tipo
        $totalPorTipo = \App\Models\Habitacion::select('tipo', DB::raw('count(*) as cnt'))
            ->groupBy('tipo')
            ->pluck('cnt', 'tipo')
            ->toArray();

        // Asegurar claves para todos los tipos
        foreach ($tipos as $t) {
            $totalPorTipo[$t] = $totalPorTipo[$t] ?? 0;
        }

        $resultados = [];
        $periodo = new \DatePeriod($desde, new \DateInterval('P1D'), $hasta->copy()->addDay());

        foreach ($periodo as $dia) {
            $fecha = $dia->format('Y-m-d');

            // Habitaciones asignadas agrupadas por tipo (usando join con la tabla habitaciones)
            $asignadasPorTipo = DB::table('habitacion_reserva')
                ->join('habitaciones', 'habitacion_reserva.habitacion_id', '=', 'habitaciones.id')
                ->whereDate('habitacion_reserva.check_in', '<=', $fecha)
                ->whereDate('habitacion_reserva.check_out', '>', $fecha)
                ->whereNotNull('habitacion_reserva.habitacion_id')
                ->groupBy('habitaciones.tipo')
                ->selectRaw('habitaciones.tipo as tipo, count(distinct habitacion_reserva.habitacion_id) as cnt')
                ->pluck('cnt', 'tipo')
                ->toArray();

            // Placeholder / habitaciones sin asignar pero con tipo (habitacion_reserva.tipo)
            $placeholdersPorTipo = \App\Models\HabitacionReserva::whereDate('check_in', '<=', $fecha)
                ->whereDate('check_out', '>', $fecha)
                ->whereNull('habitacion_id')
                ->whereNotNull('tipo')
                ->groupBy('tipo')
                ->selectRaw('tipo, count(*) as cnt')
                ->pluck('cnt', 'tipo')
                ->toArray();

            $porTipo = [];
            $totalOcupadasDia = 0;

            foreach ($tipos as $t) {
                $ocupadasTipo = ($asignadasPorTipo[$t] ?? 0) + ($placeholdersPorTipo[$t] ?? 0);
                $porcentajeTipo = $totalPorTipo[$t] > 0 ? round(($ocupadasTipo / $totalPorTipo[$t]) * 100, 2) : 0;

                $porTipo[$t] = [
                    'ocupadas' => (int)$ocupadasTipo,
                    'porcentaje' => $porcentajeTipo,
                ];

                $totalOcupadasDia += $ocupadasTipo;
            }

            // Reservas sin habitaciones (no tienen relación habitaciones)
            $reservasSinHabitaciones = \App\Models\Reserva::whereDate('check_in', '<=', $fecha)
                ->whereDate('check_out', '>', $fecha)
                ->whereDoesntHave('habitaciones')
                ->count();

            $totalOcupadasDia += $reservasSinHabitaciones;

            $porcentajeTotal = $totalHabitaciones > 0 ? round(($totalOcupadasDia / $totalHabitaciones) * 100, 2) : 0;

            $resultados[] = [
                'fecha' => $fecha,
                'por_tipo' => $porTipo,
                'ocupadas' => $totalOcupadasDia,
                'porcentaje_ocupacion' => $porcentajeTotal,
            ];
        }

        // promedio de ocupación en el periodo (total)
        $promedio = 0;
        if (!empty($resultados)) {
            $promedio = round(array_sum(array_column($resultados, 'porcentaje_ocupacion')) / count($resultados), 2);
        }

        // promedio por tipo
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

        return response()->json([
            'success' => true,
            'data' => [
                'total_habitaciones' => $totalHabitaciones,
                'total_por_tipo' => $totalPorTipo,
                'por_dia' => $resultados,
                'promedio_porcentaje_ocupacion' => $promedio,
                'promedio_porcentaje_ocupacion_por_tipo' => $promedioPorTipo,
                'fecha_desde' => $desde->format('Y-m-d'),
                'fecha_hasta' => $hasta->format('Y-m-d'),
            ],
        ]);
    }
}
