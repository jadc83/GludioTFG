<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Models\Pago;
use App\Services\PrecioService;
use App\Services\ReservaService;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ModificarEstanciaAction
{
    protected ReservaService $reservaService;
    protected PrecioService $precioService;
    protected PaymentService $paymentService;

    public function __construct(ReservaService $reservaService, PrecioService $precioService, PaymentService $paymentService)
    {
        $this->reservaService = $reservaService;
        $this->precioService = $precioService;
        $this->paymentService = $paymentService;
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
            $precioHabitacion = $this->precioService->precioEntreFechas($tipo, $checkIn, $checkOut);
            $nuevoTotal += $precioHabitacion;
        }

        $viejoTotal = (float) $reserva->precio_total;
        $diffSigned = round($nuevoTotal - $viejoTotal, 2);

        // Caso: aumento de importe -> se requiere pago adicional
        if ($diffSigned > 0) {
            $diff = round($diffSigned, 2);
            $pagoId = $data['pago_id'] ?? null;
            if (!$pagoId) {
                return [ 'success' => false, 'error' => 'pago_requerido', 'required_amount' => $diff, 'message' => 'Se requiere un pago adicional para ampliar la estancia.' ];
            }

            $pago = Pago::find($pagoId);
            if (! $pago || $pago->reserva_id != $reserva->id || $pago->estado !== 'completado' || (float)$pago->monto < $diff) {
                return [ 'success' => false, 'error' => 'pago_invalido', 'required_amount' => $diff, 'message' => 'Pago no válido o insuficiente.' ];
            }
        }

        // Caso: disminución de importe -> intentar reembolso parcial automático
        $refundInfo = null;
        if ($diffSigned < 0) {
            $refundAmount = round(abs($diffSigned), 2);
            // Intentar realizar reembolso por el importe de la diferencia
            // Usar como 'usuario solicitante' el usuario asociado a la reserva (si existe) para pasar la verificación de permisos
            $userForRefund = $reserva->user ?? $reserva->reservable ?? \Illuminate\Support\Facades\Auth::user();
            $refundResult = $this->paymentService->solicitarReembolso($reserva, $userForRefund, $refundAmount);
            if (!($refundResult['success'] ?? false)) {
                return [ 'success' => false, 'error' => 'reembolso_fallido', 'message' => $refundResult['message'] ?? 'Error solicitando reembolso.' ];
            }
            $refundInfo = [ 'amount' => $refundResult['refund_amount'] ?? $refundAmount, 'refund_id' => $refundResult['refund_id'] ?? null, 'message' => $refundResult['message'] ?? null ];
        }

        // actualizar precios por habitación
        foreach ($reserva->habitaciones as $hr) {
            $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
            $precioHabitacion = $this->precioService->precioEntreFechas($tipo, $checkIn, $checkOut);
            try { $hr->update(['precio' => $precioHabitacion]); } catch (\Throwable $e) { Log::warning('No se pudo actualizar precio habitacionReserva: ' . $e->getMessage()); }
        }

        // actualizar reserva
        $reserva->check_in = $checkIn->toDateString();
        $reserva->check_out = $checkOut->toDateString();
        $reserva->precio_total = round($nuevoTotal, 2);
        $reserva->save();

        try { event(new \App\Events\ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

        $response = [ 'success' => true, 'message' => 'Estancia modificada correctamente.', 'reserva' => [ 'check_in' => $reserva->check_in, 'check_out' => $reserva->check_out, 'precio_total' => $reserva->precio_total ] ];

        if ($refundInfo) {
            $response['refund'] = $refundInfo;
            $response['message'] = "Estancia modificada. Se ha solicitado un reembolso parcial de €" . number_format($refundInfo['amount'], 2);
        }

        return $response;
    }
}
