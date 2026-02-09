<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Reserva;
use App\Models\Pago;
use App\Models\Refund;
use App\Models\RefundRequest;

class RefundServiceStatusSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_reserva_not_marked_cancelado_when_latest_refund_leaves_pending_nuevo_total()
    {
        $reserva = Reserva::factory()->create(['precio_total' => 637.5, 'status' => 'confirmado']);

        // Pago original completado
        $pago = Pago::create([
            'reserva_id' => $reserva->id,
            'stripe_payment_intent_id' => 'pi_orig',
            'monto' => 637.5,
            'moneda' => 'eur',
            'estado' => 'completado',
            'descripcion' => 'Pago original',
            'stripe_response' => ['id' => 'pi_orig'],
            'pagado_en' => now(),
        ]);

        // Simular Refund procesado que devuelve el total y deja pending_nuevo_total 450
        $rr = RefundRequest::create([
            'reserva_id' => $reserva->id,
            'pago_id' => $pago->id,
            'requested_amount_cents' => 63750,
            'status' => 'processed',
            'processed_at' => now(),
            'processed_refund_amount_cents' => 63750,
            'pending_nuevo_total' => 450.00,
        ]);

        // Crear refund record
        Refund::create([
            'pago_id' => $pago->id,
            'reserva_id' => $reserva->id,
            'amount_cents' => 63750,
            'currency' => 'eur',
            'status' => 'succeeded',
            'stripe_refund_id' => 're_test',
            'stripe_response' => ['simulated' => true],
        ]);

        $svc = $this->app->make(\App\Services\RefundService::class);
        $svc->sincronizarEstadoReservaSegunReembolsos($reserva->fresh());

        $fresh = Reserva::find($reserva->id);
        $this->assertNotEquals('cancelado', $fresh->status);
        $this->assertEquals('confirmado', $fresh->status);
    }
}
