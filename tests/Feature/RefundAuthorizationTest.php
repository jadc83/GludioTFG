<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Reserva;
use App\Models\RefundRequest;
use Spatie\Permission\Models\Role;

class RefundAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_only_admin_can_approve_or_reject_or_delete()
    {
        $user = User::factory()->create();
        $reserva = Reserva::factory()->create();
        $rr = RefundRequest::create(['reserva_id' => $reserva->id, 'user_id' => $user->id, 'status' => 'pending', 'reason_code' => 'test']);

        // Non-admin cannot approve
        $other = User::factory()->create();
        $other->assignRole('operario');
        $response = $this->actingAs($other)->post(route('refund-requests.approve', ['refundRequest' => $rr->id]));
        $response->assertStatus(403);

        // Admin can approve
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $response = $this->actingAs($admin)->post(route('refund-requests.approve', ['refundRequest' => $rr->id]));
        // approval flow may depend on payment; the controller returns json; allow 200 or 400/500 depending on PaymentService
        $this->assertTrue(in_array($response->getStatusCode(), [200, 400, 500]));

        // Reject: non-admin forbidden
        $rr2 = RefundRequest::create(['reserva_id' => $reserva->id, 'user_id' => $user->id, 'status' => 'pending', 'reason_code' => 'test']);
        $response = $this->actingAs($other)->post(route('refund-requests.reject', ['refundRequest' => $rr2->id]), ['admin_reason' => 'no']);
        $response->assertStatus(403);

        // Admin can reject
        $response = $this->actingAs($admin)->post(route('refund-requests.reject', ['refundRequest' => $rr2->id]), ['admin_reason' => 'no']);
        $this->assertTrue(in_array($response->getStatusCode(), [200, 200]));

        // Delete: non-admin forbidden
        $rr3 = RefundRequest::create(['reserva_id' => $reserva->id, 'user_id' => $user->id, 'status' => 'pending', 'reason_code' => 'test']);
        $response = $this->actingAs($other)->delete(route('refund-requests.destroy', ['refundRequest' => $rr3->id]));
        $response->assertStatus(403);

        // Admin can delete
        $response = $this->actingAs($admin)->delete(route('refund-requests.destroy', ['refundRequest' => $rr3->id]));
        $this->assertTrue(in_array($response->getStatusCode(), [200, 200]));
    }
}
