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

                // Log para debug
                \Log::info("CalcularPreciosPorTipoAction", [
                    'tipo' => $slug,
                    'check_in' => $checkIn->format('Y-m-d'),
                    'check_out' => $checkOut->format('Y-m-d'),
                    'noches' => $noches,
                    'total' => $total,
                    'por_noche' => $porNoche
                ]);

                $result[$slug] = ['total' => (float)$total, 'por_noche' => $porNoche, 'noches' => $noches];
            } catch (\Throwable $e) {
                \Log::error("Error calculando precio para tipo {$slug}: " . $e->getMessage());
                $result[$slug] = ['total' => 0.0, 'por_noche' => 0.0, 'noches' => $noches];
            }
        }

        return $result;
    }
}
