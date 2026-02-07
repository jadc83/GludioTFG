<?php

namespace App\Services;

/**
 * ReservaCreator ya no se usa — la lógica fue movida a ReservaService::crearReserva().
 * Este stub existe por compatibilidad y lanzará una excepción si se invoca accidentalmente.
 *
 * @deprecated Use ReservaService::crearReserva instead
 */
class ReservaCreator
{
    /**
     * @deprecated Este constructor ya no recibe servicios; la clase es un stub deprecado.
     */
    public function __construct()
    {
        // Deprecated stub
    }

    public function create(array $datos, $usuario = null, string $status = 'pendiente')
    {
        throw new \BadMethodCallException('ReservaCreator está deprecado. Usa ReservaService::crearReserva en su lugar.');
    }
}
