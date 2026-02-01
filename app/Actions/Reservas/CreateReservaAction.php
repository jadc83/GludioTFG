<?php

namespace App\Actions\Reservas;

use App\Services\ReservaService;
use App\Mail\ReservaCompletada;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CreateReservaAction
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function handle(array $data, $usuario = null, string $status = 'pendiente'): array
    {
        $reserva = $this->reservaService->crearReserva($data, $usuario, $status);
        $reserva->load(['reservable', 'habitaciones.habitacion', 'cupon']);



        return ['success' => true, 'reserva_id' => $reserva->id, 'localizador' => $reserva->localizador, 'reserva' => $reserva];
    }
}
