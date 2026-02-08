<?php

namespace App\Actions\Estadisticas;

use Illuminate\Support\Facades\DB;
use App\Models\HabitacionReserva;

class ContarPorTipoAction
{

    public static function handle(string $fecha): array
    {
        $asignadasPorTipo = DB::table('habitacion_reserva')
            ->join('habitaciones', 'habitacion_reserva.habitacion_id', '=', 'habitaciones.id')
            ->whereDate('habitacion_reserva.check_in', '<=', $fecha)
            ->whereDate('habitacion_reserva.check_out', '>', $fecha)
            ->whereNotNull('habitacion_reserva.habitacion_id')
            ->groupBy('habitaciones.tipo')
            ->selectRaw('habitaciones.tipo as tipo, count(distinct habitacion_reserva.habitacion_id) as cnt')
            ->pluck('cnt', 'tipo')
            ->toArray();

        $placeholdersPorTipo = HabitacionReserva::whereDate('check_in', '<=', $fecha)
            ->whereDate('check_out', '>', $fecha)
            ->whereNull('habitacion_id')
            ->whereNotNull('tipo')
            ->groupBy('tipo')
            ->selectRaw('tipo, count(*) as cnt')
            ->pluck('cnt', 'tipo')
            ->toArray();

        $reservasSinHabitaciones = \App\Models\Reserva::whereDate('check_in', '<=', $fecha)
            ->whereDate('check_out', '>', $fecha)
            ->whereDoesntHave('habitaciones')
            ->count();

        return [
            'asignadasPorTipo' => $asignadasPorTipo,
            'placeholdersPorTipo' => $placeholdersPorTipo,
            'reservasSinHabitaciones' => $reservasSinHabitaciones,
            'reservasSinHabitacion' => $reservasSinHabitaciones,
        ];
    }
}
