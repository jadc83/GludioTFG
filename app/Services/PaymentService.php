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
	protected ?StripeClient $stripe = null;
	protected RefundService $refundService;

	/**
	 * Constructor del servicio de pagos
	 * Inicializa RefundService
	 * Usado por: inyección automática de dependencias
	 */
	public function __construct(?RefundService $refundService = null)
	{
		$this->refundService = $refundService ?? new RefundService();
	}

	/**
	 * Obtiene instancia de StripeClient (lazy loading)
	 * Inicializa solo cuando se necesita
	 */
	protected function getStripe(): StripeClient
	{
		if ($this->stripe === null) {
			$stripeSecret = env('STRIPE_SECRET_KEY');
			if (!$stripeSecret) {
				throw new \RuntimeException('STRIPE_SECRET_KEY no está configurada en el archivo .env. Por favor, configura la clave de Stripe.');
			}
			$this->stripe = new StripeClient($stripeSecret);
		}
		return $this->stripe;
	}

	/**
	 * Verifica si una reserva puede ser reembolsada
	 * Comprueba tiempo hasta check-in y estado del pago
	 * Usado por: interfaces de reembolso
	 * Retorna: boolean indicando posibilidad de reembolso
	 */
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

	/**
	 * Solicita reembolso para una reserva
	 * Crea solicitud y procesa reembolso automático si aplica
	 * Usado por: acciones de reembolso desde panel de control
	 * Retorna: array con resultado de la solicitud
	 */
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

		// Verificar si ya existe un refund reciente con el mismo monto (idempotencia)
		$existingRefund = Refund::where('pago_id', $pago->id)
			->where('amount_cents', $montoCents)
			->where('created_at', '>', now()->subMinutes(5))
			->first();

		if ($existingRefund && $existingRefund->status === 'succeeded') {
			Log::warning('Refund ya existe para este pago y monto', [
				'reserva_id' => $reserva->id,
				'pago_id' => $pago->id,
				'monto_cents' => $montoCents,
				'stripe_refund_id' => $existingRefund->stripe_refund_id
			]);

			return [
				'success' => true,
				'refund_id' => $existingRefund->stripe_refund_id,
				'refund_amount' => $existingRefund->amount_cents / 100,
				'message' => 'Refund ya existe'
			];
		}

		try {
			return DB::transaction(function () use ($reserva, $pago, $pi_id, $montoCents) {
				$stripeRefund = $this->getStripe()->refunds->create([
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

	/**
	 * Maneja eventos de reembolso desde Stripe webhooks
	 * Procesa confirmaciones de reembolso y actualiza registros
	 * Usado por: controladores de webhooks de Stripe
	 * Retorna: void
	 */
	public function manejarEventoReembolso($refundObj): void
	{
		try {
			$refundData = is_object($refundObj) && property_exists($refundObj, 'refunds') ?end($refundObj->refunds->data) : $refundObj;

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
		// Actualizar estado del pago según reembolsos
		$this->refundService->sincronizarEstadoPagoSegunReembolsos($pago);

		// Actualizar estado de la reserva según reembolsos
		$this->refundService->sincronizarEstadoReservaSegunReembolsos($reserva);
	}

	private function obtenerPaymentIntentId(?Pago $pago, Reserva $reserva): ?string
	{
		if ($pago && $pago->stripe_payment_intent_id) {
			return $pago->stripe_payment_intent_id;
		}
		try {
			$search = $this->getStripe()->paymentIntents->search([
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
		// Sumar solo refunds completados de este pago específico
		$reembolsado = (int)Refund::where('pago_id', $pago->id)
			->where('status', 'succeeded') // Solo contar refunds que Stripe confirió como exitosos
			->sum('amount_cents');

		$saldoLocal = max(0, $pagado - $reembolsado);

		// Validar contra Stripe también si tenemos PI
		if ($pago->stripe_payment_intent_id) {
			try {
				$stripeIntent = $this->getStripe()->paymentIntents->retrieve($pago->stripe_payment_intent_id);

				// Para PaymentIntent en estado succeeded, amount_capturable es 0
				// En ese caso usamos amount_received (lo que fue pagado realmente)
				// Para otros estados, amount_capturable es lo disponible para capturar
				$saldoStripe = 0;
				if ($stripeIntent->status === 'succeeded') {
					// Para pagos completados, saldo = lo recibido - lo reembolsado
					$amountReceived = $stripeIntent->amount_received ?? $stripeIntent->amount ?? 0;
					$saldoStripe = max(0, $amountReceived);
				} elseif ($stripeIntent->amount_capturable > 0) {
					// Para pagos pendientes de captura
					$saldoStripe = max(0, $stripeIntent->amount_capturable);
				} else {
					// Fallback
					$saldoStripe = max(0, $stripeIntent->amount ?? 0);
				}

				// Usar el menor de los dos (por seguridad)
				return min($saldoLocal, $saldoStripe);
			} catch (\Throwable $e) {
				Log::warning("Error validating refundable balance against Stripe: " . $e->getMessage());
			}
		}

		return $saldoLocal;
	}
}
