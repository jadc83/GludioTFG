<?php

namespace App\Actions\Habitaciones;

use App\Services\HabitacionService;
use Carbon\Carbon;

class GetDisponiblesAction
{
    private HabitacionService $service;

    public function __construct(?HabitacionService $service = null)
    {
        $this->service = $service ?? new HabitacionService();
    }

    /* Devuelve la disponibilidad formateada entre dos fechas. */
    public function handle(?string $checkIn = null, ?string $checkOut = null, bool $individuales = false): array
    {
        if ($checkIn && $checkOut) {
            $check_in = Carbon::createFromFormat('Y-m-d', $checkIn);
            $check_out = Carbon::createFromFormat('Y-m-d', $checkOut);
        } else {
            $request = request();
            $checkIn = $checkIn ?? $request->query('check_in') ?? $request->query('checkIn');
            $checkOut = $checkOut ?? $request->query('check_out') ?? $request->query('checkOut');
            $individuales = $individuales || $request->query('individuales') === 'true';
            $check_in = $checkIn ? Carbon::createFromFormat('Y-m-d', $checkIn) : null;
            $check_out = $checkOut ? Carbon::createFromFormat('Y-m-d', $checkOut) : null;
        }

        if (! $check_in || ! $check_out) {
            return $individuales
                ? $this->service->getDisponiblesIndividuales(Carbon::now(), Carbon::now()->addDay())
                : $this->service->getDisponibles(Carbon::now(), Carbon::now()->addDay(), true);
        }

        return $individuales
            ? $this->service->getDisponiblesIndividuales($check_in, $check_out)
            : $this->service->getDisponibles($check_in, $check_out, false);
    }
}
