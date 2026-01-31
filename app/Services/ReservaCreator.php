<?php

namespace App\Services;

/**
 * ReservaCreator ya no se usa — la lógica fue movida a ReservaService::crearReserva().
 * Este stub existe por compatibilidad y lanzará una excepción si se invoca accidentalmente.
 */
class ReservaCreator
{
    public function __construct(ReservaService $reservaService)
    {
        // Deprecated
    }

    public function create(array $datos, $usuario = null, string $status = 'pendiente')
    {
        throw new \BadMethodCallException('ReservaCreator está deprecado. Usa ReservaService::crearReserva en su lugar.');
    }
}
