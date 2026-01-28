<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Services\ReservaService;

class DescargarComprobanteAction
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function handle(string $localizador)
    {
        $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
            ->where('localizador', $localizador)
            ->firstOrFail();

        return $this->reservaService->generarPdf($reserva);
    }
}
