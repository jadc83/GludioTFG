<?php

namespace App\Actions\Estadisticas;

class FormatearPorDiaAction
{
    /**
     * Formatea los datos por día combinando asignadas, placeholders y totales.
     *
     * @param string $fecha
     * @param array $asignadasPorTipo
     * @param array $placeholdersPorTipo
     * @param array $totalPorTipo
     * @param int $totalHabitaciones
     * @return array
     */
    public static function handle(string $fecha, array $asignadasPorTipo, array $placeholdersPorTipo, array $totalPorTipo, int $totalHabitaciones): array
    {
        $tipos = ['doble', 'familiar', 'suite'];
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

        $porcentajeTotal = $totalHabitaciones > 0 ? round(($totalOcupadasDia / $totalHabitaciones) * 100, 2) : 0;

        return [
            'fecha' => $fecha,
            'por_tipo' => $porTipo,
            'ocupadas' => $totalOcupadasDia,
            'porcentaje_ocupacion' => $porcentajeTotal,
        ];
    }
}
