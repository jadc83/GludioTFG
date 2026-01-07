<?php

namespace App\Services;

use Carbon\Carbon;

/**
 * Servicio para cálculos de fechas y precios relacionados con reservas
 */
class DateService
{
    /**
     * Calcula la cantidad de noches entre dos fechas
     */
    public static function calcularNoches($checkIn, $checkOut): int
    {
        $checkInDate = $checkIn instanceof Carbon ? $checkIn : Carbon::parse($checkIn);
        $checkOutDate = $checkOut instanceof Carbon ? $checkOut : Carbon::parse($checkOut);

        $noches = $checkInDate->diffInDays($checkOutDate);
        return max(1, $noches); // Mínimo 1 noche
    }

    /**
     * Calcula el precio por noche basado en modificadores de temporada
     */
    public static function calcularPrecioConTemporada($precioBase, $fecha): float
    {
        $fecha = $fecha instanceof Carbon ? $fecha : Carbon::parse($fecha);

        // Temporada alta: Diciembre-Enero, Semana Santa, Verano (Julio-Agosto)
        $mes = $fecha->month;
        $dia = $fecha->day;

        // Navidades (21 dic - 7 ene)
        if (($mes === 12 && $dia >= 21) || ($mes === 1 && $dia <= 7)) {
            return $precioBase * 1.5; // +50%
        }

        // Verano (15 julio - 31 agosto)
        if ($mes >= 7 && $mes <= 8 && $dia >= 15) {
            return $precioBase * 1.35; // +35%
        }

        // Fin de semana todo el año
        if ($fecha->isWeekend()) {
            return $precioBase * 1.2; // +20%
        }

        // Precio normal
        return $precioBase;
    }

    /**
     * Calcula el precio total de una reserva
     */
    public static function calcularPrecioTotal(
        $precioBaseNoche,
        $checkIn,
        $checkOut,
        int $cantidadHabitaciones = 1
    ): float {
        $noches = self::calcularNoches($checkIn, $checkOut);

        $checkInDate = $checkIn instanceof Carbon ? $checkIn : Carbon::parse($checkIn);

        // Calcular suma de precios diarios con ajustes de temporada
        $precioTotal = 0;
        for ($i = 0; $i < $noches; $i++) {
            $fecha = $checkInDate->copy()->addDays($i);
            $precioTotal += self::calcularPrecioConTemporada($precioBaseNoche, $fecha);
        }

        // Aplicar cantidad de habitaciones
        $precioTotal *= $cantidadHabitaciones;

        return round($precioTotal, 2);
    }

    /**
     * Formatea una fecha para mostrar en el frontend
     */
    public static function formatear($fecha, string $formato = 'legible'): string
    {
        if (!$fecha) {
            return '—';
        }

        $fecha = $fecha instanceof Carbon ? $fecha : Carbon::parse($fecha);

        return match ($formato) {
            'corta' => $fecha->format('d/m/Y'),
            'legible' => $fecha->translatedFormat('d \d\e F \d\e Y'),
            'iso' => $fecha->format('Y-m-d'),
            'completa' => $fecha->translatedFormat('l, d \d\e F \d\e Y'),
            default => $fecha->format('d/m/Y'),
        };
    }

    /**
     * Obtiene el día de la semana en español
     */
    public static function obtenerDiaDelaSemana($fecha): string
    {
        $fecha = $fecha instanceof Carbon ? $fecha : Carbon::parse($fecha);
        return $fecha->translatedFormat('l');
    }

    /**
     * Verifica si una fecha es festivo en España
     */
    public static function esFestivo($fecha): bool
    {
        $fecha = $fecha instanceof Carbon ? $fecha : Carbon::parse($fecha);

        // Festivos españoles fijos
        $festivos = [
            '01-01', // Año nuevo
            '01-06', // Reyes
            '05-01', // Día del trabajo
            '08-15', // Asunción
            '10-12', // Hispanidad
            '11-01', // Todos los santos
            '12-25', // Navidad
        ];

        $fechaFormato = $fecha->format('m-d');
        return in_array($fechaFormato, $festivos) || $fecha->isWeekend();
    }
}
