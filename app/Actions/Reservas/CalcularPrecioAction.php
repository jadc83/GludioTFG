<?php

namespace App\Actions\Reservas;

use App\Services\PrecioService;
use Carbon\Carbon;

class CalcularPrecioAction
{
    protected PrecioService $precioService;

    public function __construct(PrecioService $precioService)
    {
        $this->precioService = $precioService;
    }

    /**
     * $data expects: ['check_in','check_out','habitaciones', 'tarifas'(optional)]
     */
    public function handle(array $data): array
    {
        $checkIn = Carbon::createFromFormat('Y-m-d', $data['check_in']);
        $checkOut = Carbon::createFromFormat('Y-m-d', $data['check_out']);

        $tarifas = is_array($data['tarifas'] ?? []) ? $data['tarifas'] : [];

        return $this->precioService->calcularMontoTotalConTarifas($data['habitaciones'], $checkIn, $checkOut, $tarifas);
    }
}
