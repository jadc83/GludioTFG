<?php

namespace App\Services;

use App\Models\Pago;
use App\Models\Refund;
use App\Models\Reserva;
use App\Models\RefundRequest;
use App\Events\ReservaActualizada;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Stripe\StripeClient;

class PaymentService
{
	protected ?StripeClient $stripe = null;
	protected RefundService $refundService;

	/**
	 * Constructor del servicio de pagos
	 */
	public function __construct(?RefundService $refundService = null)
	{
		$this->refundService = $refundService ?? new RefundService();
	}

	/**
	 * Obtiene instancia de StripeClient (lazy loading)
	 */
	protected function getStripe(): StripeClient
	{
		if ($this->stripe === null) {
			$stripeSecret = config('services.stripe.secret');
			if (empty($stripeSecret)) {
				throw new \RuntimeException('STRIPE_SECRET_KEY no está configurada o está vacía en el archivo .env.');
			}
			$this->stripe = new StripeClient($stripeSecret);
		}
		return $this->stripe;
	}

	/**
	 * Verifica si una reserva puede ser reembolsada
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
	 */
	public function solicitarReembolso(Reserva $reserva, $usuario, ?float $monto = null, bool $forceByAdmin = false, ?Pago $pagoOverride = null): array
	{
		if (!$forceByAdmin && !$this->puedeReembolsar($reserva)) {
			return ['success' => false, 'message' => 'No cumple las condiciones de tiempo (48h) o estado de pago.'];
		}

		$pago = $pagoOverride instanceof Pago ? $pagoOverride : $reserva->pagos()->where('estado', 'completado')->orderByDesc('pagado_en')->first();
		$pi_id = $this->obtenerPaymentIntentId($pago, $reserva);

		if (!$pago || !$pi_id) {
			return ['success' => false, 'message' => 'No se encontró un cargo de Stripe válido para esta reserva.'];
		}

		$saldoDisponible = $this->getSaldoReembolsable($pago);
		$montoCents = $monto ? (int)round($monto * 100) : $saldoDisponible;

		if ($montoCents > $saldoDisponible) {
			$montoCents = $saldoDisponible;
		}

		if ($montoCents <= 0) {
			return ['success' => false, 'message' => 'No queda saldo disponible para reembolsar en este pago.'];
		}

		// Idempotencia: evitar reembolsos duplicados en ventana de 5 min
		$existingRefund = Refund::where('pago_id', $pago->id)
			->where('amount_cents', $montoCents)
			->where('created_at', '>', now()->subMinutes(5))
			->first();

		if ($existingRefund && $existingRefund->status === 'succeeded') {
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
	 */
	public function manejarEventoReembolso($refundObj): void
	{
		try {
			$refundData = is_object($refundObj) && property_exists($refundObj, 'refunds') ? end($refundObj->refunds->data) : $refundObj;

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
		$this->refundService->sincronizarEstadoPagoSegunReembolsos($pago);
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
		$reembolsado = (int)Refund::where('pago_id', $pago->id)
			->where('status', 'succeeded')
			->sum('amount_cents');

		$saldoLocal = max(0, $pagado - $reembolsado);

		if ($pago->stripe_payment_intent_id) {
			try {
				$stripeIntent = $this->getStripe()->paymentIntents->retrieve($pago->stripe_payment_intent_id);
				$saldoStripe = 0;
				if ($stripeIntent->status === 'succeeded') {
					$amountReceived = $stripeIntent->amount_received ?? $stripeIntent->amount ?? 0;
					$saldoStripe = max(0, $amountReceived);
				} elseif ($stripeIntent->amount_capturable > 0) {
					$saldoStripe = max(0, $stripeIntent->amount_capturable);
				} else {
					$saldoStripe = max(0, $stripeIntent->amount ?? 0);
				}
				return min($saldoLocal, $saldoStripe);
			} catch (\Throwable $e) {
				Log::warning("Error validating refundable balance: " . $e->getMessage());
			}
		}

		return $saldoLocal;
	}

	/**
	 * Crear un PaymentIntent y Pago asociado
	 */
	public function crearPaymentIntentParaReserva(\App\Models\Reserva $reserva, float $monto, array $options = []): array
	{
		try {
			$receiptEmail = $options['receipt_email'] ?? $reserva->reservable?->email ?? null;
			$montoCents = (int)round($monto * 100);

			$intentData = [
				'amount' => $montoCents,
				'currency' => 'eur',
				'automatic_payment_methods' => ['enabled' => true, 'allow_redirects' => 'never'],
				'metadata' => [
					'reserva_id' => $reserva->id,
					'localizador' => $reserva->localizador,
				],
				'description' => "Pago de reserva {$reserva->localizador}",
			];

			if ($receiptEmail) $intentData['receipt_email'] = $receiptEmail;

			if (($options['confirm_with_pm'] ?? false) || app()->isLocal()) {
				$intentData['confirm'] = true;
				$intentData['payment_method'] = 'pm_card_visa';
			}

			$paymentIntent = $this->getStripe()->paymentIntents->create($intentData);

			$pago = Pago::create([
				'reserva_id' => $reserva->id,
				'stripe_payment_intent_id' => $paymentIntent->id,
				'monto' => $monto,
				'moneda' => 'eur',
				'estado' => 'procesando',
				'descripcion' => "Pago de reserva {$reserva->localizador}",
				'stripe_response' => $paymentIntent->toArray(),
			]);

			if (isset($paymentIntent->status) && $paymentIntent->status === 'succeeded') {
				$pago->update(['estado' => 'completado', 'pagado_en' => now()]);
			}

			return [
				'success' => true,
				'clientSecret' => $paymentIntent->client_secret ?? null,
				'pago_id' => $pago->id,
				'paymentIntentId' => $paymentIntent->id,
			];
		} catch (\Exception $e) {
			Log::error('Error creating PaymentIntent: ' . $e->getMessage());
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}

	/**
	 * Crear una Stripe Checkout Session
	 */
	public function crearCheckoutSessionParaReserva(\App\Models\Reserva $reserva, float $monto): array
	{
		try {
			$montoCents = (int)round($monto * 100);
			$successUrl = route('reserva.show', $reserva->localizador) . '?session_id={CHECKOUT_SESSION_ID}';

			$session = $this->getStripe()->checkout->sessions->create([
				'payment_method_types' => ['card'],
				'mode' => 'payment',
				'line_items' => [[
					'price_data' => [
						'currency' => 'eur',
						'product_data' => ['name' => "Pago reserva {$reserva->localizador}"],
						'unit_amount' => $montoCents,
					],
					'quantity' => 1,
				]],
				'success_url' => $successUrl,
				'cancel_url' => route('reserva.show', $reserva->localizador) . '?checkout=cancel',
				'metadata' => ['reserva_id' => $reserva->id],
			]);

			$pago = Pago::create([
				'reserva_id' => $reserva->id,
				'stripe_checkout_session_id' => $session->id,
				'monto' => $monto,
				'moneda' => 'eur',
				'estado' => 'procesando',
				'descripcion' => "Pago por Checkout (reserva {$reserva->localizador})",
				'stripe_response' => ['checkout_session_id' => $session->id, 'session' => $session->toArray()],
			]);

			return [
				'success' => true,
				'sessionId' => $session->id,
				'sessionUrl' => $session->url,
				'pago_id' => $pago->id,
			];
		} catch (\Throwable $e) {
			Log::error('Error creating checkout session: ' . $e->getMessage());
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}

	public function handleCheckoutSessionCompleted($session): void
	{
		try {
			$checkoutId = is_object($session) ? ($session->id ?? null) : ($session['id'] ?? null);
			Log::info('handleCheckoutSessionCompleted called', ['checkout_id' => $checkoutId, 'session' => is_object($session) ? (array)$session : $session]);
			if (!$checkoutId) return;

			$pago = Pago::where('stripe_checkout_session_id', $checkoutId)->first()
					?? Pago::where('stripe_response', 'like', '%' . $checkoutId . '%')->first();

			if (!$pago) {
				Log::warning('handleCheckoutSessionCompleted: pago no encontrado', ['checkout_id' => $checkoutId]);
				return;
			}

			DB::transaction(function() use ($pago, $session, $checkoutId) {
				$paymentIntent = is_object($session) ? ($session->payment_intent ?? null) : ($session['payment_intent'] ?? null);
				$paymentIntentId = null;
				$paymentIntentData = null;
				if (is_object($paymentIntent)) {
					$paymentIntentId = $paymentIntent->id ?? null;
					$paymentIntentData = method_exists($paymentIntent, 'toArray') ? $paymentIntent->toArray() : (array)$paymentIntent;
				} elseif (is_string($paymentIntent) || is_numeric($paymentIntent)) {
					$paymentIntentId = (string)$paymentIntent;
					$paymentIntentData = ['id' => $paymentIntentId];
				}

				$pago->update([
					'estado' => 'completado',
					'pagado_en' => now(),
					'stripe_payment_intent_id' => $paymentIntentId ?? $pago->stripe_payment_intent_id,
					'stripe_response' => array_merge($pago->stripe_response ?? [], ['checkout_session' => is_object($session) ? (method_exists($session, 'toArray') ? $session->toArray() : (array)$session) : $session, 'payment_intent' => $paymentIntentData])
				]);

				$pago->reserva->update(['pago' => 'pagado']);

				// Notificación idempotente
				$notifiable = $pago->reserva->reservable;
				$exists = DB::table('notifications')
					->where('type', \App\Notifications\PagoConfirmadoNotification::class)
					->where('data', 'like', '%"pago_id":' . $pago->id . '%')
					->exists();

				if (!$exists && $notifiable) {
					$notifiable->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
				}

				Log::info('handleCheckoutSessionCompleted: pago actualizado', ['pago_id' => $pago->id, 'checkout_id' => $checkoutId]);

				event(new ReservaActualizada($pago->reserva->fresh(['reservable', 'pagos']), null));
			});
		} catch (\Throwable $e) {
			Log::error('Error processing checkout session completed: ' . $e->getMessage());
		}
	}

	public function confirmarPaymentIntent($paymentIntent, ?Pago $pago = null): array
	{
		// Normalizar input: puede venir como objeto Stripe, array, o como cadena
		$raw = $paymentIntent;
		$paymentIntentId = null;

		if (is_object($paymentIntent)) {
			$paymentIntentId = $paymentIntent->id ?? null;
		} elseif (is_array($paymentIntent)) {
			$paymentIntentId = $paymentIntent['id'] ?? null;
		} elseif (is_string($paymentIntent)) {
			$paymentIntentId = $paymentIntent;
		}

		// Si la string contiene un JSON o un dump de Stripe, extraer el primer id pi_...
		if (is_string($paymentIntentId) && preg_match('/(pi_[A-Za-z0-9_]+)/', $paymentIntentId, $m)) {
			$paymentIntentId = $m[1];
		}

		$paymentIntentId = is_string($paymentIntentId) ? trim(preg_replace('/[[:cntrl:]]+/', '', $paymentIntentId)) : '';
		Log::info('confirmarPaymentIntent called', ['raw_input' => $raw, 'payment_intent_id' => $paymentIntentId]);

		if (!preg_match('/^pi_[A-Za-z0-9_]+$/', $paymentIntentId)) {
			Log::warning('confirmarPaymentIntent: id inválido', ['payment_intent_id' => $paymentIntentId, 'raw_input' => $raw]);
			return ['success' => false, 'error' => 'Invalid payment_intent id'];
		}

		try {
			$paymentIntent = $this->getStripe()->paymentIntents->retrieve($paymentIntentId);
			$status = $paymentIntent->status ?? null;

			if (!$pago) {
				$pago = Pago::where('stripe_payment_intent_id', $paymentIntentId)->first()
						?? Pago::where('stripe_response', 'like', '%' . $paymentIntentId . '%')->first();
			}

			if (!$pago) {
				Log::warning('confirmarPaymentIntent: Pago no encontrado para payment_intent', ['payment_intent_id' => $paymentIntentId]);
				return ['success' => false, 'error' => 'Pago no encontrado'];
			}

			$reserva = $pago->reserva;

			DB::transaction(function() use ($pago, $paymentIntent, $status, $reserva) {
				if ($status === 'succeeded') {
					$pago->update([
						'estado' => 'completado',
						'pagado_en' => now(),
						'stripe_response' => array_merge($pago->stripe_response ?? [], ['payment_intent' => $paymentIntent->toArray()])
					]);
					if ($reserva) {
						$reserva->update(['pago' => 'pagado']);
						event(new ReservaActualizada($reserva->fresh(['reservable', 'pagos']), null));
					}
				} else {
					$pago->update(['estado' => 'fallido']);
				}
			});

			Log::info('confirmarPaymentIntent: pago procesado', ['pago_id' => $pago->id, 'status' => $status]);

			return ['success' => true, 'status' => $status, 'pago_id' => $pago->id];
		} catch (\Throwable $e) {
			Log::error('Error confirming PaymentIntent: ' . $e->getMessage());
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}

	public function checkSession(string $sessionId): array
	{
		try {
			$session = $this->getStripe()->checkout->sessions->retrieve($sessionId, ['expand' => ['payment_intent']]);

			$paymentIntentId = is_object($session->payment_intent) ? $session->payment_intent->id : $session->payment_intent;
			$paymentStatus = $session->payment_status ?? null;
			Log::info('checkSession retrieved session', ['session_id' => $sessionId, 'payment_intent' => $paymentIntentId, 'payment_status' => $paymentStatus]);

			if ($paymentIntentId) {
				$resp = $this->confirmarPaymentIntent($paymentIntentId);

				// Si la confirmación local no encuentra el Pago, pero la sesión indica 'paid',
				// hacemos fallback a procesar la sesión completa (como el webhook lo haría).
				if ((($resp['success'] ?? false) === false) && $paymentStatus === 'paid') {
					$this->handleCheckoutSessionCompleted($session);
					$pago = Pago::where('stripe_checkout_session_id', $sessionId)->first();
					return ['success' => true, 'paid' => true, 'status' => 'paid', 'pago_id' => $pago->id ?? null];
				}

				return ['success' => true, 'paid' => (($resp['status'] ?? '') === 'succeeded'), 'status' => $resp['status'] ?? null, 'pago_id' => $resp['pago_id'] ?? null, 'raw' => $resp];
			}

			if ($paymentStatus === 'paid') {
				$this->handleCheckoutSessionCompleted($session);
				$pago = Pago::where('stripe_checkout_session_id', $sessionId)->first();
				return ['success' => true, 'paid' => true, 'status' => 'paid', 'pago_id' => $pago->id ?? null];
			}

			return ['success' => true, 'paid' => false, 'status' => $paymentStatus];
		} catch (\Throwable $e) {
			Log::error('Error checking session: ' . $e->getMessage());
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}

	public function handlePaymentIntentSucceeded($paymentIntent): void
	{
		$id = is_object($paymentIntent) ? ($paymentIntent->id ?? null) : ($paymentIntent['id'] ?? null);
		if ($id) $this->confirmarPaymentIntent($id);
	}

	public function handlePaymentIntentFailed($paymentIntent): void
	{
		$id = is_object($paymentIntent) ? ($paymentIntent->id ?? null) : ($paymentIntent['id'] ?? null);
		if (!$id) return;
		$pago = Pago::where('stripe_payment_intent_id', $id)->first() ?? Pago::where('stripe_response', 'like', '%' . $id . '%')->first();
		if ($pago) $pago->update(['estado' => 'fallido']);
	}
}
