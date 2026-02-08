<?php

namespace App\Services;

use App\Models\Pago;
use App\Models\Refund;
use App\Models\Reserva;
use App\Models\RefundRequest;
use App\Events\ReservaActualizada;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Stripe\StripeClient;

class PaymentService
{
	protected ?StripeClient $stripe = null;
	protected RefundService $refundService;

	/* Constructor del servicio de pagos */
	public function __construct(?RefundService $refundService = null)
	{
		$this->refundService = $refundService ?? new RefundService();
	}

	/* Obtiene instancia de StripeClient */
	protected function getStripe(): StripeClient
	{
		if ($this->stripe === null) {
			$stripeSecret = config('services.stripe.secret');
			if (empty($stripeSecret)) {
				throw new \RuntimeException('Stripe secret key no está configurada.');
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
			$checkIn = Carbon::parse($reserva->check_in);
			$limite = $checkIn->copy()->subHours(48);

			return Carbon::now()->lessThanOrEqualTo($limite) && strtolower($reserva->pago) === 'pagado';
		} catch (\Throwable $e) {
			return false;
		}
	}

	/* Solicita reembolso para una reserva */
	/**
	 * @param \App\Models\Reserva $reserva
	 * @param mixed $usuario
	 * @param float|null $monto
	 * @param bool $forceByAdmin
	 * @param ?Pago $pagoOverride
	 * @return array<string, mixed>
	 */
	public function solicitarReembolso(Reserva $reserva, mixed $usuario, ?float $monto = null, bool $forceByAdmin = false, ?Pago $pagoOverride = null): array
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
		$reembolsado = Refund::where('pago_id', $pago->id)
			->where('amount_cents', $montoCents)
			->where('created_at', '>', now()->subMinutes(5))
			->first();

		if ($reembolsado && $reembolsado->status === 'succeeded') {
			return [
				'success' => true,
				'refund_id' => $reembolsado->stripe_refund_id,
				'refund_amount' => $reembolsado->amount_cents / 100,
				'message' => 'Este reembolso ya existe'
			];
		}

		try {
			return DB::transaction(function () use ($reserva, $pago, $pi_id, $montoCents) {
				$reembolso = $this->getStripe()->refunds->create([
					'payment_intent' => $pi_id,
					'amount' => $montoCents,
				]);

				Refund::create([
					'pago_id' => $pago->id,
					'reserva_id' => $reserva->id,
					'stripe_refund_id' => $reembolso->id,
					'amount_cents' => $reembolso->amount,
					'currency' => $reembolso->currency,
					'status' => $reembolso->status,
					'stripe_response' => $reembolso->toArray(),
				]);

				$this->sincronizarEstadosPostReembolso($reserva, $pago);

				return [
					'success' => true,
					'refund_id' => $reembolso->id,
					'refund_amount' => $reembolso->amount / 100
				];
			});
		} catch (\Exception $e) {
			Log::error("Error procesando reembolso: " . $e->getMessage());
			return ['success' => false, 'message' => 'Error al procesar con Stripe: ' . $e->getMessage()];
		}
	}

	/**
	 * Maneja eventos de reembolso desde Stripe webhooks
	 *
	 * @param object|array|mixed $refundObj Raw webhook object or payload
	 * @return void
	 */
	public function manejarEventoReembolso($refundObj): void
	{
		try {
			/** @var object{id?: string, payment_intent?: string|null, amount?: int|null, status?: string|null} $reembolsoData */
			$reembolsoData = is_object($refundObj) && property_exists($refundObj, 'refunds') ? end($refundObj->refunds->data) : $refundObj;
			$reembolsoData = (object) $reembolsoData;
			$reembolsoId = $reembolsoData->id ?? null;
			$reembolsoPaymentIntent = $reembolsoData->payment_intent ?? null;
			$reembolsoAmount = $reembolsoData->amount ?? null;
			$reembolsoStatus = $reembolsoData->status ?? null;

			if (!$reembolsoId) return;
			if (Refund::where('stripe_refund_id', $reembolsoId)->exists()) return;

			$pago = Pago::where('stripe_payment_intent_id', $reembolsoPaymentIntent)->first();
			if (!$pago) return;

			DB::transaction(function () use ($pago, $reembolsoData, $reembolsoId, $reembolsoAmount, $reembolsoStatus) {
				Refund::create([
					'pago_id' => $pago->id,
					'reserva_id' => $pago->reserva_id,
					'stripe_refund_id' => $reembolsoId,
					'amount_cents' => $reembolsoAmount,
					'status' => $reembolsoStatus,
					'stripe_response' => (array)$reembolsoData,
				]);

				$this->sincronizarEstadosPostReembolso($pago->reserva, $pago);
			});

		} catch (\Throwable $e) {
			Log::error("Error en webhook de reembolso: " . $e->getMessage());
		}
	}

	/**
	 * @param Reserva $reserva
	 * @param Pago|\stdClass $pago
	 * @return void
	 */
	protected function sincronizarEstadosPostReembolso(Reserva $reserva, $pago): void
	{
		$this->refundService->sincronizarEstadoPagoSegunReembolsos($pago);
		$this->refundService->sincronizarEstadoReservaSegunReembolsos($reserva);
	}

	/**
	 * @param Pago|\stdClass|null $pago
	 * @param Reserva $reserva
	 * @return string|null
	 */
	private function obtenerPaymentIntentId($pago, Reserva $reserva): ?string
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

	/**
	 * @param Pago|\stdClass $pago
	 * @return int
	 */
	private function getSaldoReembolsable($pago): int
	{
		$pagado = (float)round($pago->monto * 100);
		$reembolsado = (int)Refund::where('pago_id', $pago->id)
			->where('status', 'succeeded')
			->sum('amount_cents');

		$saldoLocal = max(0, $pagado - $reembolsado);

		if ($pago->stripe_payment_intent_id) {
			try {
				/** @var \Stripe\PaymentIntent $stripeIntent */
				$stripeIntent = $this->getStripe()->paymentIntents->retrieve((string)$pago->stripe_payment_intent_id);
				$saldoStripe = 0;
				if ($stripeIntent->status === 'succeeded') {
					$amountReceived = $stripeIntent->amount_received ?? $stripeIntent->amount ?? 0;
					$saldoStripe = max(0, $amountReceived);
				} elseif ($stripeIntent->amount_capturable > 0) {
					$saldoStripe = max(0, $stripeIntent->amount_capturable);
				} else {
					$saldoStripe = max(0, $stripeIntent->amount ?? 0);
				}
				return (int) min((int)$saldoLocal, (int)$saldoStripe);
			} catch (\Throwable $e) {
				Log::warning("Error validating refundable balance: " . $e->getMessage());
			}
		}

		return (int) $saldoLocal;
	}

	/**
	 * Crear un PaymentIntent standalone (sin asociarlo a una Reserva).
	 * Útil para flujos en los que el front crea el PaymentIntent antes de persistir la reserva.
	 * No crea un registro `Pago` local; se asume que la reserva recibirá `payment_intent_id` y creará el Pago.
	 *
	 * @param float $monto
	 * @param array<string,mixed> $options
	 * @return array<string,mixed>
	 */
	public function crearPaymentIntentStandalone(float $monto, array $options = []): array
	{
		try {
			$montoCents = (int)round($monto * 100);
			$intentData = [
				'amount' => $montoCents,
				'currency' => 'eur',
				// Limitar a tarjeta para evitar mostrar métodos no activados (Link, etc.)
				'payment_method_types' => ['card'],
				'metadata' => $options['metadata'] ?? [],
				'description' => $options['description'] ?? 'PaymentIntent standalone',
			];

			if (!empty($options['receipt_email'])) $intentData['receipt_email'] = $options['receipt_email'];

			if (!empty($options['confirm_with_pm'])) {
				$intentData['confirm'] = true;
				$intentData['payment_method'] = $options['payment_method'] ?? 'pm_card_visa';
			}

			$paymentIntent = $this->getStripe()->paymentIntents->create($intentData);

			return [
				'success' => true,
				'clientSecret' => $paymentIntent->client_secret ?? null,
				'paymentIntentId' => $paymentIntent->id ?? null,
				'paymentIntentStatus' => $paymentIntent->status ?? null,
			];
		} catch (\Throwable $e) {
			Log::error('Error creating standalone PaymentIntent: ' . $e->getMessage());
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}


	/**
	 * Crear un PaymentIntent y Pago asociado
	 *
	 * @param \App\Models\Reserva $reserva
	 * @param float $monto
	 * @param array<string,mixed> $options
	 * @return array<string,mixed>
	 */
	public function crearPaymentIntentParaReserva(\App\Models\Reserva $reserva, float $monto, array $options = []): array
	{
		try {
			$receiptEmail = $options['receipt_email'] ?? $reserva->reservable?->email ?? null;
			$montoCents = (int)round($monto * 100);

			$intentData = [
				'amount' => $montoCents,
				'currency' => 'eur',
				// Forzar solo tarjetas para evitar mostrar métodos extras en Elements
				'payment_method_types' => ['card'],
				'metadata' => [
					'reserva_id' => (string)$reserva->id,
					'localizador' => (string)$reserva->localizador,
				],
				'description' => "Pago de reserva {$reserva->localizador}",
			];

			if ($receiptEmail) $intentData['receipt_email'] = $receiptEmail;

			if (!empty($options['confirm_with_pm'])) {
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
	 *
	 * @param \App\Models\Reserva $reserva
	 * @param float $monto
	 * @return array<string,mixed>
	 */
	public function crearCheckoutSessionParaReserva(\App\Models\Reserva $reserva, float $monto): array
	{
		try {
			$montoCents = (int)round($monto * 100);
			$successUrl = route('reserva.show', $reserva->localizador) . '?session_id={CHECKOUT_SESSION_ID}';

			// Crear registro de Pago primero para poder pasar su id a metadata del PaymentIntent
			$pago = Pago::create([
				'reserva_id' => $reserva->id,
				'monto' => $monto,
				'moneda' => 'eur',
				'estado' => 'procesando',
				'descripcion' => "Pago por Checkout (reserva {$reserva->localizador})",
				'stripe_response' => [],
			]);

			try {
				$session = $this->getStripe()->checkout->sessions->create([
					'payment_method_types' => ['card'],
					'mode' => 'payment',
					'line_items' => [[
						'price_data' => [
							'currency' => 'eur',
							'product_data' => ['name' => "Pago reserva {$reserva->localizador}"],
						'unit_amount' => (int)$montoCents,
					],
					'quantity' => 1,
				]],
				'success_url' => $successUrl,
				'cancel_url' => route('reserva.show', $reserva->localizador) . '?checkout=cancel',
				'metadata' => ['reserva_id' => (string)$reserva->id],
				// Añadir metadata al PaymentIntent que se cree automáticamente para poder mapear desde webhooks
				'payment_intent_data' => ['metadata' => ['pago_id' => (string)$pago->id, 'reserva_id' => (string)$reserva->id]],
				]);

				/** @var \Stripe\Checkout\Session $session */

				// Actualizar pago con información de la sesión creada
				$pago->update([
					'stripe_checkout_session_id' => $session->id,
					'stripe_response' => array_merge($pago->stripe_response ?? [], ['checkout_session_id' => $session->id, 'session' => $session->toArray()]),
					'stripe_payment_intent_id' => is_object($session->payment_intent) ? ($session->payment_intent->id ?? null) : (is_string($session->payment_intent) ? $session->payment_intent : $pago->stripe_payment_intent_id)
				]);
			} catch (\Throwable $e) {
				// Si falla crear la sesión, marcar pago como fallido y registra el error
				$pago->update(['estado' => 'fallido', 'stripe_response' => array_merge($pago->stripe_response ?? [], ['error' => $e->getMessage()])]);
				Log::error('Error creating checkout session after creating Pago: ' . $e->getMessage());
				return ['success' => false, 'error' => $e->getMessage()];
			}

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

	/**
	 * Maneja el caso cuando una Checkout Session indica pago completado
	 *
	 * @param mixed $session Stripe session object or array
	 * @return void
	 */
	public function handleCheckoutSessionCompleted(mixed $session): void
	{
		try {
			/** @var \Stripe\Checkout\Session|array<string,mixed> $session */
			$checkoutId = is_object($session) ? ($session->id ?? null) : ($session['id'] ?? null);
			Log::info('handleCheckoutSessionCompleted called', ['checkout_id' => $checkoutId, 'session' => is_object($session) ? (array)$session : $session]);
			if (!$checkoutId) return;

			$pago = Pago::where('stripe_checkout_session_id', $checkoutId)->first()
					?? Pago::where('stripe_response', 'like', '%' . $checkoutId . '%')->first();

			if (!$pago) {
				Log::warning('handleCheckoutSessionCompleted: pago no encontrado', ['checkout_id' => $checkoutId]);
				return;
			}

			// Actualizar datos dentro de una transacción y dejar notificaciones fuera
			try {
				DB::transaction(function() use ($pago, $session) {
					$paymentIntent = is_object($session) ? ($session->payment_intent ?? null) : ($session['payment_intent'] ?? null);
				/** @var mixed $paymentIntent */
					$paymentIntentData = null;
					if (is_object($paymentIntent)) {
						$paymentIntentId = $paymentIntent->id ?? null;
					// Prefer array cast to avoid relying on SDK methods in static analysis
					$paymentIntentData = (array)$paymentIntent;
					}

					$pago->update([
						'estado' => 'completado',
						'pagado_en' => now(),
						'stripe_payment_intent_id' => $paymentIntentId ?? $pago->stripe_payment_intent_id,
							'stripe_response' => array_merge($pago->stripe_response ?? [], [
							'checkout_session' => is_object($session) ? (array)$session : $session,
							'payment_intent' => $paymentIntentData ?? (array)$paymentIntent,
							]),
						]);
						$pago->reserva->update(['pago' => 'pagado']);
					});

					Log::info('handleCheckoutSessionCompleted: pago actualizado (transaction committed)', ['pago_id' => $pago->id, 'checkout_id' => $checkoutId]);
					$notifiable = $pago->reserva->reservable;

					$exists = DB::table('notifications')
						->where('type', \App\Notifications\PagoConfirmadoNotification::class)
						->where('data', 'like', '%"pago_id":' . $pago->id . '%')
						->exists();

					if (! $exists) {
						/** @var object|null $notifiable */
						if (is_object($notifiable) && method_exists($notifiable, 'notify')) {
							$notifiable->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
						} else {
							\Illuminate\Support\Facades\Notification::route('mail', $pago->reserva->reservable?->email ?? null)
								->notify(new \App\Notifications\PagoConfirmadoNotification($pago));
						}
					}

				} catch (\Throwable $e) {
					Log::warning('EnviarEmailReservaActualizada failed: ' . $e->getMessage());
				}

		} catch (\Throwable $e) {
			Log::error('Error processing checkout session completed: ' . $e->getMessage());
		}
	}

	/**
	 * Confirmar estado de un PaymentIntent y actualizar pagos locales
	 *
	 * @param mixed $paymentIntent Object, array or string id
	 * @param \App\Models\Pago|null $pago Optional Pago override
	 * @return array<string,mixed>
	 */
	public function confirmarPaymentIntent(mixed $paymentIntent, ?Pago $pago = null): array
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
		Log::debug('confirmarPaymentIntent called', ['raw_input' => $raw, 'payment_intent_id' => $paymentIntentId]);

		if (!preg_match('/^pi_[A-Za-z0-9_]+$/', $paymentIntentId)) {
			Log::warning('confirmarPaymentIntent: id inválido', ['payment_intent_id' => $paymentIntentId, 'raw_input' => $raw]);
			return ['success' => false, 'error' => 'Invalid payment_intent id'];
		}

		try {
			$paymentIntent = $this->getStripe()->paymentIntents->retrieve($paymentIntentId);
			/** @var mixed $paymentIntent */
			$status = $paymentIntent->status ?? null;
			// Log basic payment intent info and metadata for debugging fallback mapping
			try {
				$piMeta = isset($paymentIntent->metadata) ? (array)$paymentIntent->metadata : null;
			} catch (\Throwable $e) {
				$piMeta = null;
			}
			Log::debug('confirmarPaymentIntent: retrieved payment_intent', ['id' => $paymentIntentId, 'status' => $status, 'metadata' => $piMeta]);

			if (!$pago) {
				$pago = Pago::where('stripe_payment_intent_id', $paymentIntentId)->first()
						?? Pago::where('stripe_response', 'like', '%' . $paymentIntentId . '%')->first();
			}

			if (!$pago) {
				// Intentar fallback: buscar Checkout Session asociada al PaymentIntent y mapear al Pago
				try {
					Log::debug('confirmarPaymentIntent: attempting fallback - listing checkout sessions', ['payment_intent_id' => $paymentIntentId]);
					$sessions = $this->getStripe()->checkout->sessions->all(['payment_intent' => $paymentIntentId, 'limit' => 1]);

					$sessionPreviews = [];
					if (!empty($sessions->data) && count($sessions->data) > 0) {
						foreach ($sessions->data as $s) {
							$sessionPreviews[] = [
								'id' => is_object($s) ? ($s->id ?? null) : ($s['id'] ?? null),
								'metadata' => is_object($s) && property_exists($s, 'metadata') ? (array)$s->metadata : (is_array($s) && isset($s['metadata']) ? (array)$s['metadata'] : []),
							];
						}
					}

					Log::debug('confirmarPaymentIntent: sessions list result', ['count' => count($sessions->data ?? []), 'sessions_preview' => $sessionPreviews]);

					if (!empty($sessions->data) && count($sessions->data) > 0) {
						/** @var \Stripe\Checkout\Session|array<string,mixed> $session */
						$session = $sessions->data[0];
						$meta = [];
						if (is_object($session) && property_exists($session, 'metadata')) {
							$meta = (array)$session->metadata;
						} elseif (is_array($session) && isset($session['metadata'])) {
							$meta = (array)$session['metadata'];
						}

						Log::debug('confirmarPaymentIntent: session metadata found', ['payment_intent_id' => $paymentIntentId, 'session_id' => is_object($session) ? ($session->id ?? null) : ($session['id'] ?? null), 'metadata' => $meta]);

						// Si la metadata de la session está vacía, intentar usar la metadata del PaymentIntent
						if (empty($meta)) {
							try {
								$piMetaCandidate = [];
								if (is_object($paymentIntent) && property_exists($paymentIntent, 'metadata')) {
									// Normalizar metadata robustamente: usar json encode/decode para evitar estructuras internas de Stripe SDK
									try {
										$piMetaCandidate = json_decode((string) json_encode($paymentIntent->metadata), true) ?: [];
									} catch (\Throwable $_e) {
										$piMetaCandidate = is_array($paymentIntent->metadata) ? (array)$paymentIntent->metadata : [];
									}
								}

								// Si aún no encontramos claves directas, buscar recursivamente en el array por 'pago_id'/'reserva_id'
								if (!empty($piMetaCandidate)) {
									// flatten possible nested structures
									$flat = [];
									$iterator = new \RecursiveIteratorIterator(new \RecursiveArrayIterator($piMetaCandidate));
									foreach ($iterator as $k => $v) {
										// recursive iterator gives values; we need keys mapping — instead, check top-level keys first
									}

									Log::debug('confirmarPaymentIntent: usando metadata desde PaymentIntent porque session metadata está vacía', ['payment_intent_id' => $paymentIntentId, 'pi_metadata' => $piMetaCandidate]);
									$meta = array_merge($meta, $piMetaCandidate);
								}
							} catch (\Throwable $e) {
								Log::warning('confirmarPaymentIntent: error extrayendo metadata del PaymentIntent: ' . $e->getMessage());
							}
						}

						// Si la metadata incluye pago_id, usarla
						if (!empty($meta['pago_id'])) {
							$foundPago = Pago::find((int)$meta['pago_id']);
							if ($foundPago) {
								$pago = $foundPago;
								Log::info('confirmarPaymentIntent: Pago encontrado por pago_id metadata', ['pago_id' => $pago->id]);
							} else {
								Log::warning('confirmarPaymentIntent: pago_id metadata presente pero no existe en DB', ['pago_id' => $meta['pago_id']]);
							}
						}

						// Si no hay pago_id pero hay reserva_id, intentar localizar pago por reserva y session id
						if (!$pago && !empty($meta['reserva_id'])) {
							$lookupSessionId = is_object($session) ? ($session->id ?? null) : ($session['id'] ?? null);
							$foundPago = Pago::where('reserva_id', (int)$meta['reserva_id'])
								->where('stripe_checkout_session_id', $lookupSessionId)
								->first();
							if ($foundPago) {
								$pago = $foundPago;
								Log::info('confirmarPaymentIntent: Pago encontrado por reserva_id + session_id', ['pago_id' => $pago->id]);
							} else {
								Log::warning('confirmarPaymentIntent: no se encontró Pago por reserva_id + session_id', ['reserva_id' => $meta['reserva_id'], 'session_id' => $lookupSessionId]);
							}
						}

						// Si encontramos pago, asegurarnos de persistir el stripe_payment_intent_id
						if ($pago) {
							$pago->update(['stripe_payment_intent_id' => $paymentIntentId, 'stripe_response' => array_merge($pago->stripe_response ?? [], ['checkout_session' => is_object($session) ? (method_exists($session, 'toArray') ? $session->toArray() : (array)$session) : (array)$session])]);
							Log::info('confirmarPaymentIntent: Pago encontrado vía Checkout Session', ['payment_intent_id' => $paymentIntentId, 'pago_id' => $pago->id]);
						}
					}
				} catch (\Throwable $e) {
					Log::warning('confirmarPaymentIntent fallback: error buscando Checkout Session: ' . $e->getMessage());
				}

				if (!$pago) {
					// Añadir contexto extra en el log: metadata del PaymentIntent si existe
					$piMetaForLog = null;
					try { $piMetaForLog = isset($paymentIntent->metadata) ? (array)$paymentIntent->metadata : null; } catch (\Throwable $__e) { $piMetaForLog = null; }
					Log::warning('confirmarPaymentIntent: Pago no encontrado para payment_intent', ['payment_intent_id' => $paymentIntentId, 'payment_intent_metadata' => $piMetaForLog]);
					return ['success' => false, 'error' => 'Pago no encontrado'];
				}
			}

			$reserva = $pago->reserva;

			// Actualizar dentro de transacción pero emitir eventos fuera para evitar rollback por fallos de broadcast
			DB::transaction(function() use ($pago, $paymentIntent, $status, $reserva) {
				if ($status === 'succeeded') {
					$pago->update([
						'estado' => 'completado',
						'pagado_en' => now(),
						'stripe_response' => array_merge($pago->stripe_response ?? [], ['payment_intent' => (is_object($paymentIntent) && method_exists($paymentIntent, 'toArray')) ? $paymentIntent->toArray() : (array)$paymentIntent])
					]);
					if ($reserva) {
						$reserva->update(['pago' => 'pagado']);
					}
				} else {
					$pago->update(['estado' => 'fallido']);
				}
			});

			// Fuera de la transacción: emitir evento y notificaciones de forma segura (no deben hacer rollback)
			try {
				$pago = $pago->fresh(['reserva', 'reserva.reservable', 'reserva.pagos']);
				try { event(new ReservaActualizada($pago->reserva->fresh(['reservable', 'pagos']), null)); } catch (\Throwable $e) { Log::warning('Emitir ReservaActualizada failed (confirmarPaymentIntent): ' . $e->getMessage()); }
			} catch (\Throwable $e) {
				Log::warning('confirmarPaymentIntent: fallo tras actualizar pago al refrescar datos para evento: ' . $e->getMessage());
			}

			Log::info('confirmarPaymentIntent: pago procesado', ['pago_id' => $pago->id, 'status' => $status]);

			return ['success' => true, 'status' => $status, 'pago_id' => $pago->id];
		} catch (\Throwable $e) {
			Log::error('Error confirming PaymentIntent: ' . $e->getMessage());
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}

	/**
	 * Revisa una Checkout Session por ID y sincroniza el pago si es necesario
	 *
	 * @param string $sessionId
	 * @return array<string,mixed>
	 */
	public function checkSession(string $sessionId): array
	{
		try {
			$session = $this->getStripe()->checkout->sessions->retrieve($sessionId, ['expand' => ['payment_intent']]);
			/** @var mixed $session */
			$paymentIntentCandidate = $session->payment_intent ?? null;
			/** @var mixed $paymentIntentCandidate */
			$paymentIntentId = is_object($paymentIntentCandidate) ? ($paymentIntentCandidate->id ?? null) : $paymentIntentCandidate;
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
				$pago = Pago::where('stripe_checkout_session_id', $sessionId)->first();			Log::debug('checkSession: found pago for session', ['session_id' => $sessionId, 'pago_id' => $pago->id ?? null]);				return ['success' => true, 'paid' => true, 'status' => 'paid', 'pago_id' => $pago->id ?? null];
			}

			return ['success' => true, 'paid' => false, 'status' => $paymentStatus];
		} catch (\Throwable $e) {
			Log::error('Error checking session: ' . $e->getMessage());
			return ['success' => false, 'error' => $e->getMessage()];
		}
	}

	/**
	 * Handler para evento payment_intent.succeeded
	 *
	 * @param mixed $paymentIntent
	 * @return void
	 */
	public function handlePaymentIntentSucceeded(mixed $paymentIntent): void
	{
		$id = is_object($paymentIntent) ? ($paymentIntent->id ?? null) : ($paymentIntent['id'] ?? null);
		if ($id) $this->confirmarPaymentIntent($id);
	}

	/**
	 * Handler para evento payment_intent.failed
	 *
	 * @param mixed $paymentIntent
	 * @return void
	 */
	public function handlePaymentIntentFailed(mixed $paymentIntent): void
	{
		$id = is_object($paymentIntent) ? ($paymentIntent->id ?? null) : ($paymentIntent['id'] ?? null);
		if (!$id) return;
		$pago = Pago::where('stripe_payment_intent_id', $id)->first() ?? Pago::where('stripe_response', 'like', '%' . $id . '%')->first();
		if ($pago) $pago->update(['estado' => 'fallido']);
	}
}
