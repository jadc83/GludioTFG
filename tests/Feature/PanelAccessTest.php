<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Spatie\Permission\Models\Role;

class PanelAccessTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        // Seed roles
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_encargado_can_access_panel()
    {
        $role = Role::firstOrCreate(['name' => 'encargado']);
        $user = User::factory()->create();
        $user->assignRole('encargado');

        $response = $this->actingAs($user)->get('/panel');
        $response->assertStatus(200);
    }

    public function test_admin_can_access_panel()
    {
        $role = Role::firstOrCreate(['name' => 'admin']);
        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user)->get('/panel');
        $response->assertStatus(200);
    }

    public function test_non_encargado_cannot_access_panel()
    {
        $user = User::factory()->create();
        // No role
        $response = $this->actingAs($user)->get('/panel');
        $response->assertStatus(403);

        // operario role should also be forbidden
        $user2 = User::factory()->create();
        $user2->assignRole('operario');
        $response = $this->actingAs($user2)->get('/panel');
        $response->assertStatus(403);
    }
}
