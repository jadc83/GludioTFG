<?php

namespace App\Exceptions;

use Exception;

class ReservaValidationException extends Exception
{
    public function __construct(string $field, string $message)
    {
        parent::__construct("Validación fallida en '{$field}': {$message}", 422);
    }
}
