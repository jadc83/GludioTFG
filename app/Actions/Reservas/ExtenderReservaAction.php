<?php

namespace App\Actions\Reservas;

use App\Services\ReservaService;

class ExtenderReservaAction
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function handle(string $localizador, int $numeroDias, bool $confirmar = false): array
    {
        return $this->reservaService->extenderReserva($localizador, $numeroDias, $confirmar);
    }
}
