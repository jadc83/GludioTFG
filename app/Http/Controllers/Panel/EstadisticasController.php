<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EstadisticasController extends Controller
{
    /**
     * Retorna estadísticas de ocupación para una fecha o un rango de fechas.
     * Parámetros: date_from (Y-m-d), date_to (Y-m-d)
     */
    public function ocupacion(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d',
        ]);

        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;

        if (! $dateFrom && ! $dateTo) {
            $dateFrom = Carbon::now()->format('Y-m-d');
            $dateTo = $dateFrom;
        } elseif ($dateFrom && ! $dateTo) {
            $dateTo = $dateFrom;
        } elseif (! $dateFrom && $dateTo) {
            $dateFrom = $dateTo;
        }

        $from = Carbon::parse($dateFrom);
        $to = Carbon::parse($dateTo);

        if ($to->lessThan($from)) {
            // swap
            [$from, $to] = [$to, $from];
        }

        $totalRooms = \App\Models\Habitacion::count();

        $results = [];
        $period = new \DatePeriod($from, new \DateInterval('P1D'), $to->copy()->addDay());

        foreach ($period as $d) {
            $date = $d->format('Y-m-d');

            // Count distinct habitaciones reserved for this day (assigned room ids)
            $occupiedFromRooms = \App\Models\HabitacionReserva::whereDate('check_in', '<=', $date)
                ->whereDate('check_out', '>', $date)
                ->distinct('habitacion_id')
                ->whereNotNull('habitacion_id')
                ->count('habitacion_id');

            // Count reservations that overlap this day but have NO habitaciones assigned or only habitaciones without habitacion_id (Sin asignar)
            $unassignedReservations = \App\Models\Reserva::whereDate('check_in', '<=', $date)
                ->whereDate('check_out', '>', $date)
                ->where(function($q) use ($date) {
                    $q->whereDoesntHave('habitaciones')
                      ->orWhereHas('habitaciones', function($q2) use ($date) {
                          $q2->whereDate('check_in', '<=', $date)
                             ->whereDate('check_out', '>', $date)
                             ->whereNull('habitacion_id');
                      });
                })
                ->count();

            $occupied = $occupiedFromRooms + $unassignedReservations;

            $percent = $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 2) : 0;

            $results[] = [
                'date' => $date,
                'occupied' => $occupied,
                'occupancy_percent' => $percent,
            ];
        }

        // average occupancy across period
        $average = 0;
        if (!empty($results)) {
            $average = round(array_sum(array_column($results, 'occupancy_percent')) / count($results), 2);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_rooms' => $totalRooms,
                'per_day' => $results,
                'average_occupancy_percent' => $average,
                'date_from' => $from->format('Y-m-d'),
                'date_to' => $to->format('Y-m-d'),
            ],
        ]);
    }
}
