<?php
require __DIR__ . '/../vendor/autoload.php';

use Stripe\Stripe;
use Stripe\PaymentIntent;

// Bootstrap Laravel to access models and config
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;
use App\Models\Reserva;

Stripe::setApiKey(config('services.stripe.secret'));

$pagoId = $argv[1] ?? null;
$reservaId = $argv[1] ?? null;

try {
	// Try to resolve argument as Pago id first, then as Reserva id
	$pago = null;
	if ($pagoId && is_numeric($pagoId)) {
		$pago = Pago::find($pagoId);
	}

	if ($pago) {
		$monto = (float)$pago->monto;
		$reserva = $pago->reserva;
	} else {
		$reserva = Reserva::find($reservaId);
		if (! $reserva) { echo "No se encontró Pago ni Reserva con identificador {$reservaId}\n"; exit(1); }
		$monto = (float)$reserva->precio_total;
		// create placeholder Pago
		$pago = Pago::create([
			'reserva_id' => $reserva->id,
			'monto' => $monto,
			'moneda' => 'eur',
			'estado' => 'procesando',
			'descripcion' => "Pago (test) reserva {$reserva->localizador}",
			'stripe_payment_intent_id' => 'placeholder_' . uniqid(),
			'stripe_response' => null,
		]);
	}

	$amount = (int)round($monto * 100);

	echo "Creando PaymentIntent card-only amount={$amount} (cents)\n";
	$pi = PaymentIntent::create([
		'amount' => $amount,
		'currency' => 'eur',
		'payment_method_types' => ['card'],
		'metadata' => [ 'reserva_id' => $reserva->id, 'localizador' => $reserva->localizador ],
		'description' => "Pago de reserva {$reserva->localizador}",
		'confirm' => true,
		'payment_method' => 'pm_card_visa',
	]);

	echo "PaymentIntent created: id={$pi->id} status={$pi->status}\n";

	// Update Pago record
	$pago->stripe_payment_intent_id = $pi->id;
	$pago->stripe_response = $pi->toArray();
	$pago->estado = ($pi->status === 'succeeded') ? 'completado' : 'procesando';
	$pago->save();

	if ($pi->status === 'succeeded') {
		echo "Pago confirmado y marcado como pagado (pago_id={$pago->id})\n";
	} else {
		echo "PaymentIntent status: {$pi->status}\n";
	}

	exit(0);

} catch (\Stripe\Exception\ApiErrorException $e) {
	echo "Stripe API Error: " . $e->getMessage() . "\n";
	exit(1);
} catch (\Exception $e) {
	echo "Error: " . $e->getMessage() . "\n";
	exit(1);
}
