<?php

namespace App\Exceptions;

use Exception;

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
