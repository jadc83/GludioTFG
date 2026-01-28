<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Services\PrecioService;
use App\Services\ReservaService;
use Carbon\Carbon;

class PreviewModificarEstanciaAction
{
    protected ReservaService $reservaService;
    protected PrecioService $precioService;

    public function __construct(ReservaService $reservaService, PrecioService $precioService)
    {
        $this->reservaService = $reservaService;
        $this->precioService = $precioService;
    }

    public function handle(string $localizador, array $data): array
    {
        $reserva = Reserva::where('localizador', $localizador)->with('habitaciones.habitacion')->firstOrFail();

        $checkIn = Carbon::createFromFormat('Y-m-d', $data['check_in']);
        $checkOut = Carbon::createFromFormat('Y-m-d', $data['check_out']);

        // Reuse service logic where possible
        $disponible = true;
        foreach ($reserva->habitaciones as $hr) {
            $habitacionId = $hr->habitacion_id ?? null;
            if ($habitacionId && ! $this->reservaService->verificarDisponibilidadHabitacion($habitacionId, $checkIn, $checkOut, $reserva->id)) {
                $disponible = false;
                break;
            }
        }

        $nuevoTotal = 0;
        foreach ($reserva->habitaciones as $hr) {
            $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
            $precioHabitacion = $this->precioService->precioEntreFechas($tipo, $checkIn, $checkOut);
            $nuevoTotal += $precioHabitacion;
        }

        $viejoTotal = (float) $reserva->precio_total;
        $nightsOld = Carbon::parse($reserva->check_in)->diffInDays(Carbon::parse($reserva->check_out));
        $nightsNew = $checkIn->diffInDays($checkOut);

        $estimateRefund = 0.00;
        $estimateCharge = 0.00;
        $penalizacion = 0.00;

        if ($nuevoTotal < $viejoTotal) {
            $rawRefund = round($viejoTotal - $nuevoTotal, 2);
            $penalizacion = floatval(config('pricing.penalty_change', 20.00));
            $estimateRefund = max(0, round($rawRefund - $penalizacion, 2));
        } else {
            $estimateCharge = round(max(0, $nuevoTotal - $viejoTotal), 2);
        }

        return [
            'success' => true,
            'available' => $disponible,
            'nuevo_total' => round($nuevoTotal, 2),
            'viejo_total' => round($viejoTotal, 2),
            'nights_old' => $nightsOld,
            'nights_new' => $nightsNew,
            'estimate_refund' => $estimateRefund,
            'penalizacion' => $penalizacion,
            'estimate_charge' => $estimateCharge,
        ];
    }
}
