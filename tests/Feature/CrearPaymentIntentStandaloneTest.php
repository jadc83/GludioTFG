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
        $servicio = $this->app->make(PaymentService::class);
        $respuesta = $servicio->crearPaymentIntentStandalone(5.0, []);
        $this->assertFalse($respuesta['success']);
        $this->assertStringContainsString('PaymentIntent requires metadata', $respuesta['error']);
    }

    public function test_controller_allows_flag_to_create_without_metadata()
    {
        $carga = ['monto' => 12.5, 'allow_without_metadata' => true];
        $respuestaHttp = $this->postJson('/pagos/crear-payment-intent-standalone', $carga);
        $respuestaHttp->assertStatus(200);
        $respuestaHttp->assertJsonStructure(['success', 'clientSecret', 'paymentIntentId']);
        $this->assertTrue($respuestaHttp->json('success'));
    }
}
