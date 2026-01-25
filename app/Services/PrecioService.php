<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\TipoHabitacion;
use App\Models\Tarifa;

class PrecioService
{

    /* Se cargan los precios desde la base de datos */

    /* Obtiene el mapa de precios base desde la base de datos */
    private static ?array $mapaPreciosBase = null;

        /* Obtiene el precio base para un tipo de habitación (desde BD) */
    public function obtenerPrecioBase(string $tipo): float
    {
        $tipoKey = strtolower(trim($tipo));
        $mapeo = $this->cargarMapaPreciosBase();
        return $mapeo[$tipoKey] ?? 0;
    }

    private function cargarMapaPreciosBase(): array
    {
        if (self::$mapaPreciosBase !== null) {
            return self::$mapaPreciosBase;
        }

        $mapeo = TipoHabitacion::query()->pluck('precio_base', 'slug')->toArray();
        // Asegurar claves en minúsculas
        $mapeoMinusculas = [];
        foreach ($mapeo as $slug => $precio) {
            $mapeoMinusculas[strtolower($slug)] = (float) $precio;
        }

        self::$mapaPreciosBase = $mapeoMinusculas;
        return self::$mapaPreciosBase;
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

    /**
     * Calcula el monto total aplicando tarifas seleccionadas.
     */
    public function calcularMontoTotalConTarifas(array $habitaciones, Carbon $checkIn, Carbon $checkOut, array $tarifas = []): array
    {
        $resultado = $this->calcularMontoTotal($habitaciones, $checkIn, $checkOut);

        if (isset($resultado['error'])) {
            return $resultado;
        }

        $subtotal = $resultado['total'] ?? 0;
        $numeroNoches = $resultado['numeroNoches'] ?? $checkIn->diffInDays($checkOut);

        $totalUnidadesHabitacion = 0;
        foreach ($habitaciones as $h) {
            $totalUnidadesHabitacion += (int)($h['cantidad'] ?? 0);
        }

        $tarifasAplicadas = [];
        $cargoTarifas = 0;

        if (!empty($tarifas)) {
            $tarifaObjs = Tarifa::whereIn('id', $tarifas)->get();
            foreach ($tarifaObjs as $t) {
                $mod = (float)($t->modificador_precio ?? 0);
                $slug = (string)($t->slug ?? '');
                $cargo = 0.0;

                // Desayuno siempre gratuito
                if (stripos($slug, 'desayuno') !== false) {
                    $cargo = 0.0;
                }
                // Media‑pensión: aplicar por noche y por unidad de habitación
                else if (stripos($slug, 'media') !== false || stripos($slug, 'media-pension') !== false) {
                    $cargo = round($mod * $numeroNoches * max(0, $totalUnidadesHabitacion), 2);
                }
                // Otros: una sola vez por reserva
                else {
                    $cargo = round($mod, 2);
                }

                $cargoTarifas += $cargo;
                $tarifasAplicadas[] = [
                    'id' => $t->id,
                    'nombre' => $t->nombre,
                    'slug' => $slug,
                    'modificador_precio' => $mod,
                    'cargo' => $cargo,
                ];
            }
        }

        $total = round(($subtotal + $cargoTarifas), 2);

        $resultado['subtotal_habitaciones'] = round($subtotal, 2);
        $resultado['numeroNoches'] = $numeroNoches;
        $resultado['tarifas_aplicadas'] = $tarifasAplicadas;
        $resultado['cargo_tarifas'] = round($cargoTarifas, 2);
        $resultado['total'] = $total;

        return $resultado;
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
        // Obtener tipos desde tabla de tipos de habitación en la BD
        $tipos = TipoHabitacion::pluck('slug')->toArray();
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
