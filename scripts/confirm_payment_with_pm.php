<?php
require __DIR__ . '/../vendor/autoload.php';

use Stripe\Stripe;
use Stripe\PaymentIntent;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;

Stripe::setApiKey(config('services.stripe.secret'));

$paymentIntentId = $argv[1] ?? null;
$pagoId = $argv[2] ?? null;

if (! $paymentIntentId || ! $pagoId) {
	echo "Usage: php confirm_payment_with_pm.php {payment_intent_id} {pago_id}\n";
	exit(1);
}

try {
	echo "Confirming PaymentIntent {$paymentIntentId} with pm_card_visa...\n";
	$pi = PaymentIntent::retrieve($paymentIntentId);
	$confirmed = $pi->confirm([ 'payment_method' => 'pm_card_visa' ]);
	echo "Status after confirm: " . ($confirmed->status ?? 'unknown') . "\n";

	$pago = Pago::find($pagoId);
	if ($pago) {
		$pago->stripe_payment_intent_id = $confirmed->id;
		$pago->stripe_response = $confirmed->toArray();
		$pago->estado = ($confirmed->status === 'succeeded') ? 'pagado' : 'procesando';
		$pago->save();
		echo "Pago {$pago->id} actualizado. estado={$pago->estado}\n";
	}

	exit(0);
} catch (\Stripe\Exception\ApiErrorException $e) {
	echo "Stripe API Error: " . $e->getMessage() . "\n";
	exit(1);
} catch (\Exception $e) {
	echo "Error: " . $e->getMessage() . "\n";
	exit(1);
}
