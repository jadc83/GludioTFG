<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Models\Pago;
use App\Services\PrecioService;
use App\Services\ReservaService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ModificarEstanciaAction
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

        // disponibilidade
        foreach ($reserva->habitaciones as $hr) {
            $habitacionId = $hr->habitacion_id ?? null;
            if ($habitacionId && ! $this->reservaService->verificarDisponibilidadHabitacion($habitacionId, $checkIn, $checkOut, $reserva->id)) {
                return [ 'success' => false, 'message' => "No hay disponibilidad para la habitación " . ($hr->habitacion?->numero ?? $habitacionId) ];
            }
        }

        // calcular nuevo total
        $nuevoTotal = 0;
        foreach ($reserva->habitaciones as $hr) {
            $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
            $precioHabitacion = $this->precioService->calcularPrecioEntreFechas($tipo, $checkIn, $checkOut);
            $nuevoTotal += $precioHabitacion;
        }

        $viejoTotal = (float) $reserva->precio_total;
        $diff = round(max(0, $nuevoTotal - $viejoTotal), 2);

        if ($diff > 0) {
            $pagoId = $data['pago_id'] ?? null;
            if (!$pagoId) {
                return [ 'success' => false, 'error' => 'pago_requerido', 'required_amount' => $diff, 'message' => 'Se requiere un pago adicional para ampliar la estancia.' ];
            }

            $pago = Pago::find($pagoId);
            if (! $pago || $pago->reserva_id != $reserva->id || $pago->estado !== 'completado' || (float)$pago->monto < $diff) {
                return [ 'success' => false, 'error' => 'pago_invalido', 'required_amount' => $diff, 'message' => 'Pago no válido o insuficiente.' ];
            }
        }

        // actualizar precios por habitación
        foreach ($reserva->habitaciones as $hr) {
            $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
            $precioHabitacion = $this->precioService->calcularPrecioEntreFechas($tipo, $checkIn, $checkOut);
            try { $hr->update(['precio' => $precioHabitacion]); } catch (\Throwable $e) { Log::warning('No se pudo actualizar precio habitacionReserva: ' . $e->getMessage()); }
        }

        // actualizar reserva
        $reserva->check_in = $checkIn->toDateString();
        $reserva->check_out = $checkOut->toDateString();
        $reserva->precio_total = round($nuevoTotal, 2);
        $reserva->save();

        try { event(new \App\Events\ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

        return [ 'success' => true, 'message' => 'Estancia modificada correctamente.', 'reserva' => [ 'check_in' => $reserva->check_in, 'check_out' => $reserva->check_out, 'precio_total' => $reserva->precio_total ] ];
    }
}
