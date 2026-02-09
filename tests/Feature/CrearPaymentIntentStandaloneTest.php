<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Services\PaymentService;

class CrearPaymentIntentStandaloneTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_payment_intent_requires_metadata_by_default()
    {
        $svc = $this->app->make(PaymentService::class);
        $resp = $svc->crearPaymentIntentStandalone(5.0, []);
        $this->assertFalse($resp['success']);
        $this->assertStringContainsString('PaymentIntent requires metadata', $resp['error']);
    }

    public function test_controller_allows_flag_to_create_without_metadata()
    {
        $payload = ['monto' => 12.5, 'allow_without_metadata' => true];
        $res = $this->postJson('/pagos/crear-payment-intent-standalone', $payload);
        $res->assertStatus(200);
        $res->assertJsonStructure(['success', 'clientSecret', 'paymentIntentId']);
        $this->assertTrue($res->json('success'));
    }
}
