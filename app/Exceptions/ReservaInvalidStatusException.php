<?php

namespace App\Exceptions;

use Exception;

class ReservaInvalidStatusException extends Exception
{
    public function __construct(string $status)
    {
        parent::__construct("Operación no permitida en estado '{$status}'", 409);
    }
}
