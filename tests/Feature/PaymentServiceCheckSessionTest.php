<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\PaymentService;
use App\Models\Pago;

// Simple helper used by tests to simulate Stripe Checkout Sessions API
class FakeSessions {
    private $s;
    public function __construct($s) { $this->s = $s; }
    public function retrieve($id, $opts = []) { return $this->s; }
}

// Lightweight fake Stripe client that avoids invoking the real SDK constructor/magic
class FakeStripeClient extends \Stripe\StripeClient {
    public $checkout;
    public function __construct() { /* intentionally bypass parent constructor for tests */ }
}

class PaymentServiceCheckSessionTest extends TestCase
{
    public function test_check_session_with_payment_intent_calls_confirmar()
    {
        $session = (object) ['id' => 'sess_123', 'payment_intent' => 'pi_123', 'payment_status' => 'paid', 'status' => 'complete'];

        $svc = new class($session) extends PaymentService {
            private $session;
            public function __construct($session = null) { parent::__construct(); $this->session = $session; }
            protected function getStripe(): \Stripe\StripeClient {
                $s = $this->session;
                $sessionsClass = new FakeSessions($s);
                $fake = new FakeStripeClient();
                $fake->checkout = (object)['sessions' => $sessionsClass];
                return $fake;
            }
            public function confirmarPaymentIntent(string $paymentIntentId, ?\App\Models\Pago $pago = null): array {
                return ['success' => true, 'status' => 'succeeded', 'pago_id' => 999];
            }
        };

        $result = $svc->checkSession('sess_123');

        $this->assertTrue($result['success']);
        $this->assertTrue($result['paid']);
        $this->assertEquals('succeeded', $result['status']);
        $this->assertEquals(999, $result['pago_id']);
    }

    public function test_check_session_unpaid_returns_not_paid()
    {
        $session = (object) ['id' => 'sess_456', 'payment_intent' => null, 'payment_status' => 'unpaid', 'status' => 'open'];

        $svc = new class($session) extends PaymentService {
            private $session;
            public function __construct($session = null) { parent::__construct(); $this->session = $session; }
            protected function getStripe(): \Stripe\StripeClient {
                $s = $this->session;
                $sessionsClass = new FakeSessions($s);
                $fake = new FakeStripeClient();
                $fake->checkout = (object)['sessions' => $sessionsClass];
                return $fake;
            }
        };

        $result = $svc->checkSession('sess_456');
        $this->assertTrue($result['success']);
        $this->assertFalse($result['paid']);
        $this->assertEquals('unpaid', $result['status']);
    }
}
