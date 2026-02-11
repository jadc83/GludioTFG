<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Empleado;
use App\Models\Departamento;
use Carbon\Carbon;

class TurnoControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_empleado_puede_crear_turno()
    {
        $usuario = User::factory()->create();
        $departamento = Departamento::create(['name' => 'Limpieza']);
        $empleado = Empleado::create(['user_id' => $usuario->id, 'departamento_id' => $departamento->id, 'role' => 'operario']);

        $this->actingAs($usuario)
            ->postJson('/api/turnos', [
                'starts_at' => Carbon::now()->addHour()->toIsoString(),
                'ends_at' => Carbon::now()->addHours(3)->toIsoString(),
                'actividad' => 'Limpieza',
                'meta' => ['habitacion' => 101]
            ])
            ->assertStatus(201)
            ->assertJsonStructure(['turno' => ['id', 'starts_at', 'ends_at', 'actividad', 'meta']]);

        $this->assertDatabaseHas('turnos', ['actividad' => 'Limpieza', 'empleado_id' => $empleado->id]);
    }

    public function test_no_se_puede_crear_turno_solapado()
    {
        $usuario = User::factory()->create();
        $departamento = Departamento::create(['name' => 'Limpieza']);
        $empleado = Empleado::create(['user_id' => $usuario->id, 'departamento_id' => $departamento->id, 'role' => 'operario']);

        $start1 = Carbon::parse('2026-02-11 08:00');
        $end1 = Carbon::parse('2026-02-11 12:00');
        $this->actingAs($usuario)->postJson('/api/turnos', ['starts_at' => $start1->toIsoString(), 'ends_at' => $end1->toIsoString(), 'actividad' => 'A']);

        // overlapping: starts at 11:00, ends 13:00 -> overlap
        $respuesta = $this->actingAs($usuario)
            ->postJson('/api/turnos', ['starts_at' => $start1->copy()->addHours(3)->subHour()->toIsoString(), 'ends_at' => $end1->copy()->addHour()->toIsoString(), 'actividad' => 'B']);
        $respuesta->assertStatus(409)->assertJson(['error' => 'Solapamiento detectado con otro turno']);
    }

    public function test_turnos_consecutivos_permitidos()
    {
        $usuario = User::factory()->create();
        $departamento = Departamento::create(['name' => 'Limpieza']);
        $empleado = Empleado::create(['user_id' => $usuario->id, 'departamento_id' => $departamento->id, 'role' => 'operario']);

        $start1 = Carbon::parse('2026-02-11 08:00');
        $end1 = Carbon::parse('2026-02-11 12:00');
        $this->actingAs($usuario)->postJson('/api/turnos', ['starts_at' => $start1->toIsoString(), 'ends_at' => $end1->toIsoString(), 'actividad' => 'A'])->assertStatus(201);

        // back to back: starts at 12:00, ends at 16:00 -> should be allowed
        $this->actingAs($usuario)->postJson('/api/turnos', ['starts_at' => $end1->toIsoString(), 'ends_at' => $end1->copy()->addHours(4)->toIsoString(), 'actividad' => 'B'])->assertStatus(201);

        $this->assertDatabaseCount('turnos', 2);
    }

    public function test_update_detecta_solapamiento()
    {
        $usuario = User::factory()->create();
        $departamento = Departamento::create(['name' => 'Limpieza']);
        $empleado = Empleado::create(['user_id' => $usuario->id, 'departamento_id' => $departamento->id, 'role' => 'operario']);

        $t1 = $this->actingAs($usuario)->postJson('/api/turnos', ['starts_at' => '2026-02-11T08:00:00Z', 'ends_at' => '2026-02-11T12:00:00Z', 'actividad' => 'A'])->json('turno');
        $t2 = $this->actingAs($usuario)->postJson('/api/turnos', ['starts_at' => '2026-02-11T12:00:00Z', 'ends_at' => '2026-02-11T16:00:00Z', 'actividad' => 'B'])->json('turno');

        // try to move t2 to overlap t1
        $this->actingAs($usuario)->putJson("/api/turnos/{$t2['id']}", ['starts_at' => '2026-02-11T11:00:00Z', 'ends_at' => '2026-02-11T15:00:00Z', 'actividad' => 'B'])
            ->assertStatus(409)
            ->assertJson(['error' => 'Solapamiento detectado con otro turno']);
    }

    public function test_clear_turnos_devuelve_eliminados()
    {
        $usuario = User::factory()->create();
        $departamento = Departamento::create(['name' => 'Limpieza']);
        $empleado = Empleado::create(['user_id' => $usuario->id, 'departamento_id' => $departamento->id, 'role' => 'operario']);

        $this->actingAs($usuario)->postJson('/api/turnos', ['starts_at' => '2026-02-11T08:00:00Z', 'ends_at' => '2026-02-11T12:00:00Z', 'actividad' => 'A']);
        $this->actingAs($usuario)->postJson('/api/turnos', ['starts_at' => '2026-02-11T12:00:00Z', 'ends_at' => '2026-02-11T16:00:00Z', 'actividad' => 'B']);

        $respuesta = $this->actingAs($usuario)->postJson('/api/turnos/clear');
        $respuesta->assertStatus(200)->assertJsonStructure(['deleted']);
        $this->assertDatabaseCount('turnos', 0);
    }
}
