<?php

namespace App\Actions\Habitaciones;

use App\Services\PrecioService;
use Carbon\Carbon;

class CalcularPreciosPorTipoAction
{
    private PrecioService $precioService;

    public function __construct(?PrecioService $precioService = null)
    {
        $this->precioService = $precioService ?? new PrecioService();
    }

    public function handle(array $slugs, Carbon $checkIn, Carbon $checkOut): array
    {
        $result = [];
        $noches = $checkIn->diffInDays($checkOut);

        foreach ($slugs as $slug) {
            try {
                $total = $this->precioService->precioEntreFechas($slug, $checkIn, $checkOut);
                $porNoche = $noches > 0 ? round($total / $noches, 2) : 0;
                $result[$slug] = ['total' => (float)$total, 'por_noche' => $porNoche, 'noches' => $noches];
            } catch (\Throwable $e) {
                $result[$slug] = ['total' => 0.0, 'por_noche' => 0.0, 'noches' => $noches];
            }
        }

        return $result;
    }
}
