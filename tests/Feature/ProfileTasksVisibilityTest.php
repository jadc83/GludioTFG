<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Empleado;
use App\Models\Departamento;
use Spatie\Permission\Models\Role;

class ProfileTasksVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        // Seed roles
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_non_employee_or_without_role_cannot_see_tareas_and_turnos()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');
        $response->assertStatus(200);

        // Inertia prop should indicate can_view_tareas = false
        $response->assertInertia(fn ($page) => $page->where('can_view_tareas', false));
    }

    public function test_employee_with_allowed_role_sees_tareas_and_turnos()
    {
        $role = Role::firstOrCreate(['name' => 'operario']);

        $user = User::factory()->create();
        $user->assignRole('operario');

        $departamento = Departamento::create(['name' => 'Limpieza']);
        Empleado::create([ 'user_id' => $user->id, 'departamento_id' => $departamento->id, 'role' => 'operario' ]);

        $response = $this->actingAs($user)->get('/profile');
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page->where('can_view_tareas', true));
    }
}
