<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\PaymentService;

$session = (object) ['id' => 'sess_123', 'payment_intent' => 'pi_123', 'payment_status' => 'paid', 'status' => 'complete'];

// Simple helper that imitates Stripe Checkout Sessions retrieve
class LocalFakeSessions {
    private $s;
    public function __construct($s) { $this->s = $s; }
    public function retrieve($id, $opts = []) { return $this->s; }
}

// Lightweight fake Stripe client used only in debug scripts (extends StripeClient to satisfy type hint)
class LocalFakeStripeClient extends \Stripe\StripeClient {
    public $checkout;
    public function __construct() { /* bypass parent constructor */ }
    public function setSessions($sessions) { $this->checkout = (object)['sessions' => $sessions]; }
}

$svc = new class($session) extends PaymentService {
    private $session;
    public function __construct($session = null) { parent::__construct(); $this->session = $session; }
    protected function getStripe(): \Stripe\StripeClient {
        $s = $this->session;
        $sessionsClass = new LocalFakeSessions($s);
        // Use local fake client instead of extending StripeClient
        $fake = new LocalFakeStripeClient();
        $fake->setSessions($sessionsClass);
        return $fake;
    }
    public function confirmarPaymentIntent(string $paymentIntentId, ?\App\Models\Pago $pago = null): array {
        return ['success' => true, 'status' => 'succeeded', 'pago_id' => 999];
    }
};

var_export($svc->checkSession('sess_123'));

