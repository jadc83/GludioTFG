<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pago;
use App\Services\PaymentService;
use Stripe\StripeClient;

$svc = new PaymentService();
$stripe = new StripeClient(config('services.stripe.secret'));

$pagos = Pago::where('estado', 'procesando')->whereNotNull('stripe_checkout_session_id')->get();
if ($pagos->isEmpty()) {
    echo "No hay pagos en procesando con checkout_session_id.\n";
    exit(0);
}

foreach ($pagos as $pago) {
    $sessionId = $pago->stripe_checkout_session_id;
    echo "--- Pago id={$pago->id} session={$sessionId} monto={$pago->monto} ---\n";
    try {
        $session = $stripe->checkout->sessions->retrieve($sessionId, []);
    } catch (\Throwable $e) {
        echo "Error retrieving session {$sessionId}: " . $e->getMessage() . "\n";
        continue;
    }

    $pi = $session->payment_intent ?? null;
    $payment_status = $session->payment_status ?? null;
    $status = $session->status ?? null;

    echo "session.payment_intent={$pi}, payment_status={$payment_status}, status={$status}\n";

    // Handle deleted/missing reservation gracefully: check if reserva exists
    $reservaExists = (bool) ($pago->reserva ?? null);
    if (! $reservaExists) {
        echo "Warning: Pago id={$pago->id} has no reserva (possibly deleted). Will still attempt to reconcile pago without updating reserva.\n";
    }

    if ($pi) {
        echo "Found PI {$pi} for session {$sessionId}. Linking to Pago id={$pago->id} and confirming.\n";
        try {
            $pago->update(['stripe_payment_intent_id' => $pi]);
        } catch (\Throwable $e) {
            echo "Warning: could not update pago stripe_payment_intent_id: " . $e->getMessage() . "\n";
        }
        echo "Confirming payment_intent {$pi}\n";
        $r = $svc->confirmarPaymentIntent($pi);
        echo "-> result: " . json_encode($r) . "\n";

        // If confirm succeeded and reserva missing, mark pago as completed locally
        if (($r['success'] ?? false) && !$reservaExists) {
            try {
                $pago->update(['estado' => 'completado', 'pagado_en' => now()]);
                echo "Pago id={$pago->id} marked as completado (no reserva to update).\n";
            } catch (\Throwable $e) {
                echo "Error marking pago as completed locally: " . $e->getMessage() . "\n";
            }
        }

        continue;
    }

    // If no PI directly, but session indicates paid or not open, process checkout.completed
    if ($payment_status === 'paid' || $status !== 'open') {
        echo "Processing checkout.session.completed for session {$sessionId}\n";
        if ($reservaExists) {
            $svc->handleCheckoutSessionCompleted($session);
            echo "Done handleCheckoutSessionCompleted (reserva updated).\n";
        } else {
            // No reserva: update pago only
            try {
                $pago->update(['estado' => 'completado', 'pagado_en' => now(), 'stripe_response' => array_merge($pago->stripe_response ?? [], ['checkout_session' => (array)$session])]);
                echo "Pago id={$pago->id} updated to 'completado' (no reserva to update).\n";
            } catch (\Throwable $e) {
                echo "Error updating pago for session {$sessionId}: " . $e->getMessage() . "\n";
            }
        }
        continue;
    }

    echo "No action for session {$sessionId} (still open/unpaid).\n";
}

echo "Reconcile finished.\n";
