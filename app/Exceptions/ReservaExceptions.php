<?php

namespace App\Exceptions;

use Exception;

/**
 * Excepción cuando una reserva no se encuentra
 */
class ReservaNotFoundException extends Exception
{
    public function __construct(string $localizador = '')
    {
        $message = $localizador
            ? "Reserva con localizador '{$localizador}' no encontrada"
            : 'Reserva no encontrada';
        parent::__construct($message, 404);
    }
}

/**
 * Excepción cuando no hay disponibilidad de habitaciones
 */
class NoDisponibilidadException extends Exception
{
    public function __construct(string $tipo = '', int $cantidad = 0)
    {
        $message = $tipo
            ? "No hay {$cantidad} habitación/es de tipo '{$tipo}' disponibles para las fechas seleccionadas."
            : 'No hay disponibilidad para las fechas seleccionadas.';
        parent::__construct($message, 409);
    }
}

/**
 * Excepción para errores en validación de datos de reserva
 */
class ReservaValidationException extends Exception
{
    public function __construct(string $field, string $message)
    {
        parent::__construct("Validación fallida en '{$field}': {$message}", 422);
    }
}

/**
 * Excepción cuando la reserva no puede ser extendida
 */
class ReservaExtensionException extends Exception
{
    public function __construct(string $reason)
    {
        parent::__construct("No se puede extender la reserva: {$reason}", 409);
    }
}

/**
 * Excepción para operaciones no permitidas en estado actual de la reserva
 */
class ReservaInvalidStatusException extends Exception
{
    public function __construct(string $status)
    {
        parent::__construct("Operación no permitida en estado '{$status}'", 409);
    }
}


