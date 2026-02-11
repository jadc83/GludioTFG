<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Reserva;
use App\Models\Pago;

class PaymentIntentDedupeTest extends TestCase
{
    use RefreshDatabase;

    public function test_crear_payment_intent_devuelve_pago_completado_existente()
    {
        $reserva = Reserva::factory()->create(['precio_total' => 100.0]);
        $pago = Pago::create([
            'reserva_id' => $reserva->id,
            'stripe_payment_intent_id' => 'pi_existing',
            'monto' => 100.0,
            'moneda' => 'eur',
            'estado' => 'completado',
            'descripcion' => 'Pago completado',
            'stripe_response' => ['id' => 'pi_existing'],
            'pagado_en' => now(),
        ]);

        $servicio = $this->app->make(\App\Services\PaymentService::class);
        $respuesta = $servicio->crearPaymentIntentParaReserva($reserva, 100.0);

        $this->assertTrue($respuesta['success']);
        $this->assertEquals($pago->id, $respuesta['pago_id']);
        $this->assertEquals('already_completed', $respuesta['paymentIntentStatus']);
    }

    public function test_crear_payment_intent_reuses_processing_with_client_secret()
    {
        $reserva = Reserva::factory()->create(['precio_total' => 200.0]);
        $pago = Pago::create([
            'reserva_id' => $reserva->id,
            'stripe_payment_intent_id' => 'pi_proc',
            'monto' => 200.0,
            'moneda' => 'eur',
            'estado' => 'procesando',
            'descripcion' => 'Pago procesando',
            'stripe_response' => ['id' => 'pi_proc', 'client_secret' => 'secret_123'],
        ]);

        $servicio = $this->app->make(\App\Services\PaymentService::class);
        $respuesta = $servicio->crearPaymentIntentParaReserva($reserva, 200.0);

        $this->assertTrue($respuesta['success']);
        $this->assertEquals($pago->id, $respuesta['pago_id']);
        $this->assertEquals('requires_payment_method', $respuesta['paymentIntentStatus']);
        $this->assertEquals('secret_123', $respuesta['clientSecret']);
    }
}
