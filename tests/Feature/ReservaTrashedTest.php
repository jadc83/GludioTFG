<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Reserva;
use App\Models\User;

class ReservaTrashedTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_excludes_trashed_by_default(): void
    {
        $user = User::factory()->create();

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT01']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS01']);
        $reservaTrashed->delete();

        $response = $this->actingAs($user)->getJson(route('reservas.index'));

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['localizador' => 'ACT01']);
        $response->assertJsonMissing(['localizador' => 'TRS01']);
    }

    public function test_index_with_trashed_includes_deleted(): void
    {
        $user = User::factory()->create();

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT02']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS02']);
        $reservaTrashed->delete();

        $response = $this->actingAs($user)->getJson(route('reservas.index', ['trashed' => 'with']));

        $response->assertStatus(200);
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['localizador' => 'ACT02']);
        $response->assertJsonFragment(['localizador' => 'TRS02']);
    }

    public function test_index_only_trashed_returns_only_deleted(): void
    {
        $user = User::factory()->create();

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT03']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS03']);
        $reservaTrashed->delete();

        $response = $this->actingAs($user)->getJson(route('reservas.index', ['trashed' => 'only']));

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonMissing(['localizador' => 'ACT03']);
        $response->assertJsonFragment(['localizador' => 'TRS03']);
    }

    public function test_panel_only_trashed_returns_only_deleted(): void
    {
        // Crear role y asignarlo al usuario para pasar el middleware EnsureEncargado
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'encargado']);
        $user = User::factory()->create();
        $user->assignRole('encargado');

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT04']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS04']);
        $reservaTrashed->delete();

        $response = $this->actingAs($user)->get(route('panel', ['trashed' => 'only']), ['X-Inertia' => 'true']);

        if ($response->status() !== 200) {
            // En requests Inertia, una redirección se devuelve como 409 con header x-inertia-location.
            if ($response->status() === 409 && $response->headers->has('x-inertia-location')) {
                $location = $response->headers->get('x-inertia-location');
                $follow = $this->actingAs($user)->get($location);
                $this->assertStringContainsString('TRS04', $follow->getContent());
                $this->assertStringNotContainsString('ACT04', $follow->getContent());
                return;
            }

            $this->fail('Panel response (only) status=' . $response->status() . ' headers=' . json_encode($response->headers->all()) . ' body=' . $response->getContent());
        }

        // La respuesta Inertia incluye 'props' con 'reservas' como clave
        $response->assertJsonFragment(['localizador' => 'TRS04']);
        $response->assertJsonMissing(['localizador' => 'ACT04']);
    }

    public function test_panel_with_trashed_includes_deleted(): void
    {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'encargado']);
        $user = User::factory()->create();
        $user->assignRole('encargado');

        $reservaActive = Reserva::factory()->create(['localizador' => 'ACT05']);
        $reservaTrashed = Reserva::factory()->create(['localizador' => 'TRS05']);
        $reservaTrashed->delete();

        $response = $this->actingAs($user)->get(route('panel', ['trashed' => 'with']), ['X-Inertia' => 'true']);

        if ($response->status() !== 200) {
            if ($response->status() === 409 && $response->headers->has('x-inertia-location')) {
                $location = $response->headers->get('x-inertia-location');
                $follow = $this->actingAs($user)->get($location);
                $this->assertStringContainsString('TRS05', $follow->getContent());
                $this->assertStringContainsString('ACT05', $follow->getContent());
                return;
            }

            $this->fail('Panel response (with) status=' . $response->status() . ' headers=' . json_encode($response->headers->all()) . ' body=' . $response->getContent());
        }

        $response->assertJsonFragment(['localizador' => 'ACT05']);
        $response->assertJsonFragment(['localizador' => 'TRS05']);
    }
}
