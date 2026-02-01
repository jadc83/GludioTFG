<?php

namespace App\Exceptions;

use Exception;

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
