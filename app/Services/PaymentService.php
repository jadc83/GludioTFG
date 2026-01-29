<?php

namespace App\Services;

use App\Models\Pago;
use App\Models\Refund;
use App\Models\Reserva;
use App\Models\RefundRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Stripe\StripeClient;

class PaymentService
{
	protected StripeClient $stripe;

	public function __construct()
	{
		$this->stripe = new StripeClient(config('services.stripe.secret'));
	}

	public function puedeReembolsar(Reserva $reserva): bool
	{
		try {
			$checkIn = \Carbon\Carbon::parse($reserva->check_in);
			$deadline = $checkIn->copy()->subHours(48);

			return \Carbon\Carbon::now()->lessThanOrEqualTo($deadline) && strtolower($reserva->pago) === 'pagado';
		} catch (\Throwable $e) {
			return false;
		}
	}

	public function solicitarReembolso(Reserva $reserva, $usuario, ?float $monto = null, bool $forceByAdmin = false, ?Pago $pagoOverride = null): array
	{
		if (!$forceByAdmin && !$this->puedeReembolsar($reserva)) {
			return ['success' => false, 'message' => 'No cumple las condiciones de tiempo (48h) o estado de pago.'];
		}

		// Allow caller to specify a Pago to refund against (useful for admin approvals)
		if ($pagoOverride instanceof Pago) {
			$pago = $pagoOverride;
		} else {
			$pago = $reserva->pagos()->where('estado', 'completado')->orderByDesc('pagado_en')->first();
		}

		$pi_id = $this->obtenerPaymentIntentId($pago, $reserva);

		if (!$pago || !$pi_id) {
			return ['success' => false, 'message' => 'No se encontró un cargo de Stripe válido para esta reserva.'];
		}

		// Cálculo en céntimos para evitar errores de precisión en el ajuste
		$saldoDisponible = $this->getSaldoReembolsable($pago);
		$montoCents = $monto ? (int)round($monto * 100) : $saldoDisponible;

		if ($montoCents > $saldoDisponible) {
			$montoCents = $saldoDisponible; // Ajuste automático al máximo posible si hay descuadre de céntimos
		}

		if ($montoCents <= 0) {
			return ['success' => false, 'message' => 'No queda saldo disponible para reembolsar en este pago.'];
		}

		try {
			return DB::transaction(function () use ($reserva, $pago, $pi_id, $montoCents) {
				$stripeRefund = $this->stripe->refunds->create([
					'payment_intent' => $pi_id,
					'amount' => $montoCents,
				]);

				Refund::create([
					'pago_id' => $pago->id,
					'reserva_id' => $reserva->id,
					'stripe_refund_id' => $stripeRefund->id,
					'amount_cents' => $stripeRefund->amount,
					'currency' => $stripeRefund->currency,
					'status' => $stripeRefund->status,
					'stripe_response' => $stripeRefund->toArray(),
				]);

				$this->sincronizarEstadosPostReembolso($reserva, $pago);

				return [
					'success' => true,
					'refund_id' => $stripeRefund->id,
					'refund_amount' => $stripeRefund->amount / 100
				];
			});
		} catch (\Exception $e) {
			Log::error("Error procesando reembolso: " . $e->getMessage());
			return ['success' => false, 'message' => 'Error al procesar con Stripe: ' . $e->getMessage()];
		}
	}

	public function manejarEventoReembolso($refundObj): void
	{
		try {
			$refundData = is_object($refundObj) && property_exists($refundObj, 'refunds')
				? end($refundObj->refunds->data)
				: $refundObj;

			if (!$refundData || empty($refundData->id)) return;
			if (Refund::where('stripe_refund_id', $refundData->id)->exists()) return;

			$pago = Pago::where('stripe_payment_intent_id', $refundData->payment_intent)->first();
			if (!$pago) return;

			DB::transaction(function () use ($pago, $refundData) {
				Refund::create([
					'pago_id' => $pago->id,
					'reserva_id' => $pago->reserva_id,
					'stripe_refund_id' => $refundData->id,
					'amount_cents' => $refundData->amount,
					'status' => $refundData->status,
					'stripe_response' => (array)$refundData,
				]);

				$this->sincronizarEstadosPostReembolso($pago->reserva, $pago);
			});
		} catch (\Throwable $e) {
			Log::error("Error en webhook de reembolso: " . $e->getMessage());
		}
	}

	protected function sincronizarEstadosPostReembolso(Reserva $reserva, Pago $pago): void
	{
		$totalPagadoCents = (int)round($reserva->pagos()->where('estado', 'completado')->sum('monto') * 100);
		$totalReembolsadoCents = (int)$reserva->reembolsos()->sum('amount_cents');
		$precioTotalCents = (int)round(($reserva->precio_total ?? 0) * 100);

		// Marcar el pago como reembolsado a nivel de pago
		$pago->update(['estado' => 'reembolsado']);

		// Solo cancelar la reserva si los reembolsos cubren el precio total de la reserva
		if ($precioTotalCents > 0 && $totalReembolsadoCents >= $precioTotalCents) {
			$reserva->update(['pago' => 'devuelto', 'status' => 'cancelado']);
			$pago->update(['estado' => 'cancelado']);
		}

		RefundRequest::where('reserva_id', $reserva->id)
			->where('status', 'pending')
			->update([
				'status' => 'approved',
				'processed_at' => now(),
				'pago_id' => $pago->id
			]);
	}

	private function obtenerPaymentIntentId(?Pago $pago, Reserva $reserva): ?string
	{
		if ($pago && $pago->stripe_payment_intent_id) {
			return $pago->stripe_payment_intent_id;
		}
		try {
			$search = $this->stripe->paymentIntents->search([
				'query' => "metadata['localizador']:'{$reserva->localizador}'",
				'limit' => 1
			]);
			return $search->data[0]->id ?? null;
		} catch (\Throwable $e) {
			return null;
		}
	}

	private function getSaldoReembolsable(Pago $pago): int
	{
		$pagado = (int)round($pago->monto * 100);
		$reembolsado = (int)Refund::where('pago_id', $pago->id)->sum('amount_cents');
		return max(0, $pagado - $reembolsado);
	}
}
