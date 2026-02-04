<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Reserva;
use App\Models\Pago;
use App\Services\PaymentService;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_handle_checkout_session_completed_marks_pago_and_reserva_as_paid()
    {
        // Crear reserva y pago asociado (procesando)
        $localizador = strtoupper(\Illuminate\Support\Str::random(6));
        $reservaId = \Illuminate\Support\Facades\DB::table('reservas')->insertGetId([
            'localizador' => $localizador,
            'reservable_type' => \App\Models\Cliente::class,
            'reservable_id' => \App\Models\Cliente::factory()->create()->id,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(3)->toDateString(),
            'precio_total' => 69.07,
            'status' => 'pendiente',
            'pago' => 'pendiente',
            'notas' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $reserva = Reserva::find($reservaId);

        $pago = Pago::create([
            'reserva_id' => $reserva->id,
            'stripe_checkout_session_id' => 'cs_test_123',
            'stripe_payment_intent_id' => 'pi_placeholder_123',
            'monto' => 10.00,
            'moneda' => 'eur',
            'estado' => 'procesando',
            'descripcion' => 'Test checkout',
        ]);

        $service = $this->app->make(PaymentService::class);

        $session = (object)['id' => 'cs_test_123'];

        $service->handleCheckoutSessionCompleted($session);

        $pago->refresh();
        $reserva->refresh();

        $this->assertEquals('completado', $pago->estado);
        $this->assertEquals('pagado', $reserva->pago);
    }
}
