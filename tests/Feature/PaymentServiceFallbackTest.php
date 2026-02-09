<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Reserva;
use App\Models\Pago;
use App\Services\PaymentService;
use ReflectionProperty;

class PaymentServiceFallbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirmarPaymentIntent_creates_placeholder_reserva_and_pago_when_no_metadata()
    {
        // Crear un stub de PaymentIntent retornado por Stripe
        $piStub = (object) [
            'id' => 'pi_test_placeholder',
            'status' => 'succeeded',
            'amount_received' => 18750,
            'amount' => 18750,
            'currency' => 'eur',
            'metadata' => [],
            'description' => null,
            'charges' => (object)['data' => []],
        ];

        // Stub de paymentIntents y checkout
        $paymentIntentsStub = new class($piStub) {
            private $pi;
            public function __construct($pi) { $this->pi = $pi; }
            public function retrieve($id) { return $this->pi; }
            public function all() { return (object)['data' => []]; }
        };

        $checkoutStub = new class {
            public function all($args) { return (object)['data' => []]; }
            public function retrieve($id, $opts = []) { return null; }
        };

        // Devolver un objeto del tipo Stripe\StripeClient (fake) para pasar la comprobación de tipos
        $fakeStripe = new class($paymentIntentsStub, $checkoutStub) extends \Stripe\StripeClient {
            public $paymentIntents;
            public $checkout;
            public function __construct($pi, $c) { $this->paymentIntents = $pi; $this->checkout = (object)['sessions' => $c]; }
        };

        // Crear un partial mock del servicio que devuelva nuestro fake Stripe
        $service = $this->partialMock(PaymentService::class, function ($mock) use ($fakeStripe) {
            $mock->shouldAllowMockingProtectedMethods();
            $mock->shouldReceive('getStripe')->andReturn($fakeStripe);
        });
        $piStub = (object) [
            'id' => 'pi_test_placeholder',
            'status' => 'succeeded',
            'amount_received' => 18750,
            'amount' => 18750,
            'currency' => 'eur',
            'metadata' => [],
            'description' => null,
            'charges' => (object)['data' => []],
        ];

        // Stub de paymentIntents y checkout
        $paymentIntentsStub = new class($piStub) {
            private $pi;
            public function __construct($pi) { $this->pi = $pi; }
            public function retrieve($id) { return $this->pi; }
            public function all() { return (object)['data' => []]; }
        };

        $checkoutStub = new class {
            public function all($args) { return (object)['data' => []]; }
            public function retrieve($id, $opts = []) { return null; }
        };

        $stripeStub = new class($paymentIntentsStub, $checkoutStub) {
            public $paymentIntents;
            public $checkout;
            public function __construct($pi, $c) { $this->paymentIntents = $pi; $this->checkout = $c; }
        };

        // Llamada al servicio que está parcialmente mockeado para devolver nuestro stub Stripe

        $resp = $service->confirmarPaymentIntent($piStub->id);

        // DEBUG: print response
        fwrite(STDERR, "confirm_placeholder resp: " . json_encode($resp) . "\n");

        $this->assertTrue(!empty($resp['success']), 'Response should be success');
        $this->assertNotEmpty($resp['pago_id'] ?? null, 'Debe retornar pago_id');

        $pago = Pago::find($resp['pago_id']);
        $this->assertNotNull($pago, 'Pago creado');
        $this->assertNotNull($pago->reserva_id, 'Pago debe tener reserva_id');

        $reserva = Reserva::find($pago->reserva_id);
        $this->assertNotNull($reserva, 'Reserva placeholder creada');
        $this->assertStringStartsWith('AUTO-PI-', $reserva->localizador);
    }

    public function test_confirmarPaymentIntent_links_to_existing_reserva_by_description()
    {

        // Crear una reserva existente con localizador conocido
        $reserva = Reserva::create([
            'localizador' => 'TEST-LOC-123',
            'reservable_type' => \App\Models\Cliente::class,
            'reservable_id' => \App\Models\Cliente::factory()->create()->id,
            'check_in' => now()->toDateString(),
            'check_out' => now()->addDay()->toDateString(),
            'precio_total' => 50,
            'status' => 'pendiente',
            'pago' => 'pendiente',
        ]);

        $piStub = (object) [
            'id' => 'pi_test_link',
            'status' => 'succeeded',
            'amount_received' => 5000,
            'amount' => 5000,
            'currency' => 'eur',
            'metadata' => [],
            'description' => 'Pago para reserva TEST-LOC-123',
            'charges' => (object)['data' => []],
        ];

        $paymentIntentsStub = new class($piStub) {
            private $pi;
            public function __construct($pi) { $this->pi = $pi; }
            public function retrieve($id) { return $this->pi; }
            public function all() { return (object)['data' => []]; }
        };

        $checkoutStub = new class { public function all($args) { return (object)['data' => []]; } };

        // Devolver un objeto del tipo Stripe\StripeClient (fake) para pasar la comprobación de tipos
        $fakeStripe = new class($paymentIntentsStub, $checkoutStub) extends \Stripe\StripeClient {
            public $paymentIntents;
            public $checkout;
            public function __construct($pi, $c) { $this->paymentIntents = $pi; $this->checkout = (object)['sessions' => $c]; }
        };

        $service = $this->partialMock(PaymentService::class, function ($mock) use ($fakeStripe) {
            $mock->shouldAllowMockingProtectedMethods();
            $mock->shouldReceive('getStripe')->andReturn($fakeStripe);
        });

        $resp = $service->confirmarPaymentIntent($piStub->id);

        // DEBUG: print response
        fwrite(STDERR, "confirm_link resp: " . json_encode($resp) . "\n");

        $this->assertTrue(!empty($resp['success']), 'Response should be success');

        $pago = Pago::find($resp['pago_id']);
        $this->assertNotNull($pago, 'Pago creado');
        $this->assertEquals($reserva->id, $pago->reserva_id, 'Pago debe mapear a la reserva existente');
    }
}
