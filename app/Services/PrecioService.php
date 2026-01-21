<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Habitacion;

class PrecioService
{
    /* Precios base por tipo de habitación */
    private const PRECIOS_BASE = [ 'doble' => 75, 'familiar' => 125, 'suite' => 200 ];

    /* Obtiene el precio base para un tipo de habitación */
    public function obtenerPrecioBase(string $tipo): float
    {
        $tipo = strtolower(trim($tipo));
        return self::PRECIOS_BASE[$tipo] ?? 0;
    }

    /* Calcula el precio dinámico aplicando multiplicadores */
    public function calcularPrecioDinamico( string $tipo, Carbon $checkIn, Carbon $checkOut, int $cantidad = 1 ): array
     {
        $precioBase = $this->obtenerPrecioBase($tipo);

        if ($precioBase <= 0) {
            return [ 'total' => 0, 'precioPromedioPorNoche' => 0, 'desglose' => [], 'error' => 'Tipo de habitación no válido: ' . $tipo ];
        }

        $precioTotal = 0;
        $desglose = [];
        $fechaActual = $checkIn->copy();

        while ($fechaActual < $checkOut) {
            $multiplicador = $this->obtenerMultiplicador($fechaActual);
            $precioDia = $precioBase * $multiplicador;
            $precioTotal += $precioDia;

            $desglose[] = [
                'fecha' => $fechaActual->format('Y-m-d'),
                'dia' => $fechaActual->translatedFormat('l'),
                'precioBase' => $precioBase,
                'multiplicador' => $multiplicador,
                'precioDia' => round($precioDia, 2),
            ];

            $fechaActual->addDay();
        }

        $numeroNoches = $checkIn->diffInDays($checkOut);
        $precioTotalConCantidad = $precioTotal * $cantidad;
        $precioPromedioPorNoche = $numeroNoches > 0 ? round($precioTotalConCantidad / $numeroNoches, 2) : 0;

        return [
            'total' => round($precioTotalConCantidad, 2),
            'precioPromedioPorNoche' => $precioPromedioPorNoche,
            'numeroNoches' => $numeroNoches,
            'desglose' => $desglose,
        ];
    }

    /* Calcula el multiplicador para una fecha específica */
    private function obtenerMultiplicador(Carbon $fecha): float
    {
        $multiplicadores = [];

        // Temporada alta: Julio, Agosto, Diciembre 20+
        if ( $fecha->month === 7 || $fecha->month === 8 || ($fecha->month === 12 && $fecha->day >= 20))
        {
            $multiplicadores[] = 1.5;
        }

        // Temporada media: Marzo 15+, Abril
        if ( ($fecha->month === 3 && $fecha->day >= 15) || $fecha->month === 4 )
        {
            $multiplicadores[] = 1.2;
        }

        // Fin de semana: Sábado o Domingo
        if ($fecha->isWeekend()) {
            $multiplicadores[] = 1.25;
        }

        // Festivos españoles (aplicar 1.5x)
        if ($this->esFestivo($fecha)) {
            $multiplicadores[] = 1.5;
        }

        // Multiplicadores se multiplican entre sí, no se suman
        $multiplicadorFinal = 1;
        foreach ($multiplicadores as $mult) {
            $multiplicadorFinal *= $mult;
        }

        return $multiplicadorFinal;
    }

    /* Verifica si una fecha es festivo en España */
    private function esFestivo(Carbon $fecha): bool
    {
        $mes = $fecha->month;
        $dia = $fecha->day;

        // Festivos fijos españoles
        $festivosFijos = [
            '01-01' => 'Año Nuevo',
            '01-06' => 'Reyes',
            '05-01' => 'Trabajo',
            '08-15' => 'Asunción',
            '10-12' => 'Hispanidad',
            '11-01' => 'Todos los Santos',
            '12-25' => 'Navidad',
        ];

        $fecha_str = str_pad($mes, 2, '0', STR_PAD_LEFT) . '-' . str_pad($dia, 2, '0', STR_PAD_LEFT);
        return isset($festivosFijos[$fecha_str]);
    }

    /* Calcula el precio total para múltiples habitaciones */
    public function calcularMontoTotal( array $habitaciones, Carbon $checkIn, Carbon $checkOut ): array
    {
        $montoTotal = 0;
        $detallesHabitaciones = [];

        foreach ($habitaciones as $habitacion) {
            if (empty($habitacion['cantidad']) || $habitacion['cantidad'] <= 0) {
                continue;
            }

            $resultado = $this->calcularPrecioDinamico( $habitacion['tipo'] ?? '', $checkIn, $checkOut, (int)$habitacion['cantidad'] );

            if (isset($resultado['error'])) {
                return [ 'error' => $resultado['error'], 'total' => 0 ];
            }

            $montoTotal += $resultado['total'];
            $detallesHabitaciones[] = [
                'tipo' => $habitacion['tipo'],
                'cantidad' => (int)$habitacion['cantidad'],
                'precioBase' => $this->obtenerPrecioBase($habitacion['tipo']),
                'precioTotal' => $resultado['total'],
                'precioPromedioPorNoche' => $resultado['precioPromedioPorNoche']
            ];
        }

        return [ 'total' => round($montoTotal, 2), 'habitaciones' => $detallesHabitaciones,
                 'checkIn' => $checkIn->format('Y-m-d'), 'checkOut' => $checkOut->format('Y-m-d'),
                 'numeroNoches' => $checkIn->diffInDays($checkOut)
        ];
    }

    /* Calcula el precio para una habitación entre dos fechas usando precios base */
    public function calcularPrecioEntreFechas(string $tipo, Carbon $checkIn, Carbon $checkOut): float
    {
        $precioBase = $this->obtenerPrecioBase($tipo);

        if ($precioBase <= 0) {
            return 0;
        }

        $total = 0;
        $fecha = $checkIn->copy();

        while ($fecha->lt($checkOut)) {
            $multiplicador = $this->obtenerMultiplicador($fecha);
            $total += round($precioBase * $multiplicador, 2);
            $fecha->addDay();
        }

        return round($total, 2);
    }

    /* Devuelve un mapa fecha->precio mínimo entre tipos para un rango dado */
    public function preciosPorRango(Carbon $inicio, Carbon $fin): array
    {
        $tipos = Habitacion::where('estado', '!=', 'mantenimiento')->distinct()->pluck('tipo')->toArray();
        $resultados = [];
        $fecha = $inicio->copy();
        while ($fecha->lte($fin)) {
            $minimo = null;
            foreach ($tipos as $tipo) {
                $precioDia = $this->calcularPrecioEntreFechas($tipo, $fecha, $fecha->copy()->addDay());
                if ($minimo === null || $precioDia < $minimo) {
                    $minimo = $precioDia;
                }
            }
            $key = $fecha->format('Y-m-d');
            $resultados[$key] = $minimo !== null ? round($minimo, 2) : null;
            $fecha->addDay();
        }

        return $resultados;
    }

    /* Devuelve precios para un mes concreto */
    public function preciosMes(int $anio, int $mes): array
    {
        $inicio = Carbon::createFromDate($anio, $mes, 1)->startOfMonth();
        $fin = $inicio->copy()->endOfMonth();
        return $this->preciosPorRango($inicio, $fin);
    }

}
