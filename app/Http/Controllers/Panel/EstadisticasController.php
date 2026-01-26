<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

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

        $resultados = [];
        $periodo = new \DatePeriod($desde, new \DateInterval('P1D'), $hasta->copy()->addDay());

        foreach ($periodo as $dia) {
            $fecha = $dia->format('Y-m-d');

            // Contar habitaciones distintas reservadas para este día (habitaciones asignadas)
            $habitacionesOcupadasAsignadas = \App\Models\HabitacionReserva::whereDate('check_in', '<=', $fecha)
                ->whereDate('check_out', '>', $fecha)
                ->distinct('habitacion_id')
                ->whereNotNull('habitacion_id')
                ->count('habitacion_id');

            // Contar reservas que solapan este día pero NO tienen habitaciones asignadas o sólo habitaciones sin habitacion_id (Sin asignar)
            $reservasSinAsignar = \App\Models\Reserva::whereDate('check_in', '<=', $fecha)
                ->whereDate('check_out', '>', $fecha)
                ->where(function($q) use ($fecha) {
                    $q->whereDoesntHave('habitaciones')
                      ->orWhereHas('habitaciones', function($q2) use ($fecha) {
                          $q2->whereDate('check_in', '<=', $fecha)
                             ->whereDate('check_out', '>', $fecha)
                             ->whereNull('habitacion_id');
                      });
                })
                ->count();

            $ocupadas = $habitacionesOcupadasAsignadas + $reservasSinAsignar;

            $porcentaje = $totalHabitaciones > 0 ? round(($ocupadas / $totalHabitaciones) * 100, 2) : 0;

            $resultados[] = [
                'fecha' => $fecha,
                'ocupadas' => $ocupadas,
                'porcentaje_ocupacion' => $porcentaje,
            ];
        }

        // promedio de ocupación en el periodo
        $promedio = 0;
        if (!empty($resultados)) {
            $promedio = round(array_sum(array_column($resultados, 'porcentaje_ocupacion')) / count($resultados), 2);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_habitaciones' => $totalHabitaciones,
                'por_dia' => $resultados,
                'promedio_porcentaje_ocupacion' => $promedio,
                'fecha_desde' => $desde->format('Y-m-d'),
                'fecha_hasta' => $hasta->format('Y-m-d'),
            ],
        ]);
    }
}
