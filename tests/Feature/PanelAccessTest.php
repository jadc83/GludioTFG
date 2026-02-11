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

    public function test_encargado_puede_acceder_al_panel()
    {
        $role = Role::firstOrCreate(['name' => 'encargado']);
        $usuario = User::factory()->create();
        $usuario->assignRole('encargado');

        $respuesta = $this->actingAs($usuario)->get('/panel');
        $respuesta->assertStatus(200);
    }

    public function test_admin_puede_acceder_al_panel()
    {
        $role = Role::firstOrCreate(['name' => 'admin']);
        $usuario = User::factory()->create();
        $usuario->assignRole('admin');

        $respuesta = $this->actingAs($usuario)->get('/panel');
        $respuesta->assertStatus(200);
    }

    public function test_operario_mantenimiento_puede_acceder_al_panel()
    {
        Role::firstOrCreate(['name' => 'operario']);
        $usuario = User::factory()->create();
        $usuario->assignRole('operario');
        $dep = \App\Models\Departamento::create(['name' => 'Mantenimiento']);
        $usuario->empleado()->create(['departamento_id' => $dep->id, 'role' => 'operario']);

        $respuesta = $this->actingAs($usuario)->get('/panel');
        $respuesta->assertStatus(200);
    }

    public function test_operario_recepcion_puede_acceder_al_panel()
    {
        Role::firstOrCreate(['name' => 'operario']);
        $usuario = User::factory()->create();
        $usuario->assignRole('operario');
        $dep = \App\Models\Departamento::create(['name' => 'Recepcion']);
        $usuario->empleado()->create(['departamento_id' => $dep->id, 'role' => 'operario']);

        $respuesta = $this->actingAs($usuario)->get('/panel');
        $respuesta->assertStatus(200);
    }

    public function test_auxiliar_recepcion_puede_acceder_al_panel()
    {
        Role::firstOrCreate(['name' => 'auxiliar']);
        $usuario = User::factory()->create();
        $usuario->assignRole('auxiliar');
        $dep = \App\Models\Departamento::create(['name' => 'Recepcion']);
        $usuario->empleado()->create(['departamento_id' => $dep->id, 'role' => 'auxiliar']);

        $respuesta = $this->actingAs($usuario)->get('/panel');
        $respuesta->assertStatus(200);
    }

    public function test_no_encargado_no_puede_acceder_al_panel()
    {
        $usuario = User::factory()->create();
        // Sin rol
        $respuesta = $this->actingAs($usuario)->get('/panel');
        $respuesta->assertStatus(403);

        // role operario tambien debe estar prohibido
        $usuario2 = User::factory()->create();
        $usuario2->assignRole('operario');
        $respuesta = $this->actingAs($usuario2)->get('/panel');
        $respuesta->assertStatus(403);
    }
}
