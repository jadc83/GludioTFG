<?php

namespace App\Actions\Habitaciones;

use App\Services\HabitacionService;
use Carbon\Carbon;

class ContarDisponiblesPorTipoAction
{
    private HabitacionService $service;

    public function __construct(?HabitacionService $service = null)
    {
        $this->service = $service ?? new HabitacionService();
    }

    public function handle(string $checkIn, string $checkOut, bool $considerarPlaceholders = true): array
    {
        $check_in = Carbon::createFromFormat('Y-m-d', $checkIn);
        $check_out = Carbon::createFromFormat('Y-m-d', $checkOut);

        return $this->service->contarDisponiblesPorTipo($check_in, $check_out, $considerarPlaceholders);
    }
}
