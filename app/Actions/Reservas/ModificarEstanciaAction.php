<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Models\Pago;
use App\Models\RefundRequest;
use App\Services\PrecioService;
use App\Services\ReservaService;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
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

		foreach ($reserva->habitaciones as $hr) {
			$habitacionId = $hr->habitacion_id ?? null;
			if ($habitacionId && !$this->reservaService->verificarDisponibilidadHabitacion($habitacionId, $checkIn, $checkOut, $reserva->id)) {
				return ['success' => false, 'message' => "No hay disponibilidad para la habitación " . ($hr->habitacion?->numero ?? $habitacionId)];
			}
		}

		$nuevoTotal = 0;
		foreach ($reserva->habitaciones as $hr) {
			$tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
			$precioHabitacion = $this->precioService->precioEntreFechas($tipo, $checkIn, $checkOut);
			$nuevoTotal += $precioHabitacion;
		}

		$diffSigned = round($nuevoTotal - (float)$reserva->precio_total, 2);

		if ($diffSigned > 0) {
			$pagoId = $data['pago_id'] ?? null;
			if (!$pagoId) {
				return ['success' => false, 'error' => 'pago_requerido', 'required_amount' => $diffSigned];
			}
			$pago = Pago::find($pagoId);
			if (!$pago || $pago->estado !== 'completado' || (float)$pago->monto < $diffSigned) {
				return ['success' => false, 'error' => 'pago_invalido'];
			}
		}


		$refundInfo = null;
		if ($diffSigned < 0) {
			$refundAmount = abs($diffSigned);
			// Aplicar penalización fija por cambio de fechas (20 EUR por defecto)
			$penalty = config('reservas.change_penalty', 20);
			$penaltyApplied = min($refundAmount, $penalty);
			$requestedAmountAfterPenalty = max(0, $refundAmount - $penaltyApplied);

			// Crear una solicitud de reembolso en estado 'pending' para que sea aprobada manualmente
			try {
				$pagoForRequest = $reserva->pagos()->where('estado', 'completado')->orderByDesc('pagado_en')->first();
				$rr = RefundRequest::create([
					'reserva_id' => $reserva->id,
					'pago_id' => $pagoForRequest?->id ?? null,
					'requested_amount_cents' => (int)round($requestedAmountAfterPenalty * 100),
					'reason_code' => 'automatic',
					'notes' => 'Reduccion de dias. Penalizacion aplicada: ' . number_format($penaltyApplied, 2) . ' EUR',
					'user_id' => Auth::id(),
					'status' => 'pending',
					'pending_check_in' => $checkIn->toDateString(),
					'pending_check_out' => $checkOut->toDateString(),
					'pending_nuevo_total' => round($nuevoTotal, 2),
				]);

				Log::info('RefundRequest creada (auto, pending)', ['id' => $rr->id, 'reserva_id' => $rr->reserva_id, 'requested_amount_cents' => $rr->requested_amount_cents, 'penalty_cents' => (int)round($penaltyApplied * 100)]);

				$refundInfo = ['requested_amount' => $requestedAmountAfterPenalty, 'penalty_applied' => $penaltyApplied, 'refund_request_id' => $rr->id];
			} catch (\Throwable $e) {
				Log::error('Error creando RefundRequest automático: ' . $e->getMessage());
			}
		}

		// Si existe una solicitud de reembolso pendiente no aplicamos cambios a la reserva
		if (is_null($refundInfo)) {
			foreach ($reserva->habitaciones as $hr) {
				$tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
				$precioHabitacion = $this->precioService->precioEntreFechas($tipo, $checkIn, $checkOut);
				$hr->update(['precio' => $precioHabitacion, 'check_in' => $checkIn, 'check_out' => $checkOut]);
			}

			$reserva->update([
				'check_in' => $checkIn->toDateString(),
				'check_out' => $checkOut->toDateString(),
				'precio_total' => round($nuevoTotal, 2)
			]);

			return [
				'success' => true,
				'message' => 'Estancia modificada correctamente.',
				'refund' => null,
				'reserva' => $reserva->only(['check_in', 'check_out', 'precio_total'])
			];
		}

		// Si hay refundInfo significa que se ha creado una RefundRequest pendiente: no aplicar cambios aún
		return [
			'success' => true,
			'message' => 'Solicitud de reembolso creada y pendiente de aprobación. Las fechas no se han aplicado.',
			'refund' => $refundInfo,
			'reserva' => $reserva->only(['check_in', 'check_out', 'precio_total'])
		];
	}
}
