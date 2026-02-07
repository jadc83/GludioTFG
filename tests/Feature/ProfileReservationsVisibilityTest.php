<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class ProfileReservationsVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_all_authenticated_users_can_see_mis_reservas()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page->where('can_view_reservas', true));
    }

    public function test_user_with_role_also_sees_mis_reservas()
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $response = $this->actingAs($user)->get('/profile');
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page->where('can_view_reservas', true));
    }
}
