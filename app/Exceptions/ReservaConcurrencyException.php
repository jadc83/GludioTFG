<?php

namespace App\Exceptions;

use Exception;

class ReservaConcurrencyException extends Exception
{
    public function __construct(string $message = 'Error de concurrencia al actualizar la reserva')
    {
        parent::__construct($message, 409);
    }
}
