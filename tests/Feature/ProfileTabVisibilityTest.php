<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Spatie\Permission\Models\Role;

class ProfileTabVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_regular_user_can_see_profile_tab()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page->where('show_profile_tab', true));
    }

    public function test_user_with_allowed_role_sees_profile_tab()
    {
        $role = Role::firstOrCreate(['name' => 'operario']);

        $user = User::factory()->create();
        $user->assignRole('operario');

        $response = $this->actingAs($user)->get('/profile');
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page->where('show_profile_tab', true));
    }
}
