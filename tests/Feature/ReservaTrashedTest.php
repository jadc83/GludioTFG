<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Reserva;
use App\Models\User;

class ReservaTrashedTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_excluye_borradas_por_defecto(): void
    {
        $usuario = User::factory()->create();

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT01']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS01']);
        $reservaTrashed->delete();

        $respuesta = $this->actingAs($usuario)->getJson(route('reservas.index'));

        $respuesta->assertStatus(200);
        $respuesta->assertJsonCount(1);
        $respuesta->assertJsonFragment(['localizador' => 'ACT01']);
        $respuesta->assertJsonMissing(['localizador' => 'TRS01']);
    }

    public function test_index_con_trashed_incluye_borradas(): void
    {
        $usuario = User::factory()->create();

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT02']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS02']);
        $reservaTrashed->delete();

        $respuesta = $this->actingAs($usuario)->getJson(route('reservas.index', ['trashed' => 'with']));

        $respuesta->assertStatus(200);
        $respuesta->assertJsonCount(2);
        $respuesta->assertJsonFragment(['localizador' => 'ACT02']);
        $respuesta->assertJsonFragment(['localizador' => 'TRS02']);
    }

    public function test_index_solo_trashed_devuelve_solo_borradas(): void
    {
        $usuario = User::factory()->create();

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT03']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS03']);
        $reservaTrashed->delete();

        $respuesta = $this->actingAs($usuario)->getJson(route('reservas.index', ['trashed' => 'only']));

        $respuesta->assertStatus(200);
        $respuesta->assertJsonCount(1);
        $respuesta->assertJsonMissing(['localizador' => 'ACT03']);
        $respuesta->assertJsonFragment(['localizador' => 'TRS03']);
    }

    public function test_panel_solo_trashed_devuelve_solo_borradas(): void
    {
        // Crear role y asignarlo al usuario para pasar el middleware EnsureEncargado
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'encargado']);
        $usuario = User::factory()->create();
        $usuario->assignRole('encargado');

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT04']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS04']);
        $reservaTrashed->delete();

        $respuesta = $this->actingAs($usuario)->get(route('panel', ['trashed' => 'only']), ['X-Inertia' => 'true']);

        if ($respuesta->status() !== 200) {
            // En requests Inertia, una redirección se devuelve como 409 con header x-inertia-location.
            if ($respuesta->status() === 409 && $respuesta->headers->has('x-inertia-location')) {
                $location = $respuesta->headers->get('x-inertia-location');
                $follow = $this->actingAs($usuario)->get($location);
                $this->assertStringContainsString('TRS04', $follow->getContent());
                $this->assertStringNotContainsString('ACT04', $follow->getContent());
                return;
            }

            $this->fail('Panel response (only) status=' . $respuesta->status() . ' headers=' . json_encode($respuesta->headers->all()) . ' body=' . $respuesta->getContent());
        }
        // La respuesta Inertia incluye 'props' con 'reservas' como clave
        $respuesta->assertJsonFragment(['localizador' => 'TRS04']);
        $respuesta->assertJsonMissing(['localizador' => 'ACT04']);
    }

    public function test_panel_con_trashed_incluye_borradas(): void
    {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'encargado']);
        $usuario = User::factory()->create();
        $usuario->assignRole('encargado');

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT05']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS05']);
        $reservaTrashed->delete();

        $respuesta = $this->actingAs($usuario)->get(route('panel', ['trashed' => 'with']), ['X-Inertia' => 'true']);

        if ($respuesta->status() !== 200) {
            if ($respuesta->status() === 409 && $respuesta->headers->has('x-inertia-location')) {
                $location = $respuesta->headers->get('x-inertia-location');
                $follow = $this->actingAs($usuario)->get($location);
                $this->assertStringContainsString('TRS05', $follow->getContent());
                $this->assertStringContainsString('ACT05', $follow->getContent());
                return;
            }

            $this->fail('Panel response (with) status=' . $respuesta->status() . ' headers=' . json_encode($respuesta->headers->all()) . ' body=' . $respuesta->getContent());
        }

        $respuesta->assertJsonFragment(['localizador' => 'ACT05']);
        $respuesta->assertJsonFragment(['localizador' => 'TRS05']);
    }
}
