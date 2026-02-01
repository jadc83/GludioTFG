<?php

namespace App\Exceptions;

use Exception;

class ReservaExtensionException extends Exception
{
    public function __construct(string $reason)
    {
        parent::__construct("No se puede extender la reserva: {$reason}", 409);
    }
}
