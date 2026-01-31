<?php

use App\Models\Habitacion;
use App\Models\Reserva;
use App\Models\HabitacionReserva;
use App\Models\Cliente;
use App\Models\User;
use Carbon\Carbon;

it('devuelve estadisticas con desglose por tipo (doble, familiar, suite)', function () {
    // Usuario autenticado
    $user = User::factory()->create();

    // Crear cliente
    $cliente = Cliente::create([
        'name' => 'Test Cliente',
        'email' => 'cliente@example.com',
    ]);

    // Crear habitaciones: dos dobles
    $h1 = Habitacion::create(['numero' => '101', 'tipo' => 'doble', 'precio_noche' => 50, 'capacidad' => 2]);
    $h2 = Habitacion::create(['numero' => '102', 'tipo' => 'doble', 'precio_noche' => 60, 'capacidad' => 2]);

    $fecha = Carbon::now()->format('Y-m-d');
    $fechaSiguiente = Carbon::now()->addDay()->format('Y-m-d');

    // Reserva con habitación asignada (doble)
    $resAsignada = Reserva::create([
        'localizador' => 'LOC1',
        'reservable_id' => $cliente->id,
        'reservable_type' => Cliente::class,
        'check_in' => $fecha,
        'check_out' => $fechaSiguiente,
        'precio_total' => 100,
    ]);

    HabitacionReserva::create([
        'reserva_id' => $resAsignada->id,
        'habitacion_id' => $h1->id,
        'precio' => 50,
        'check_in' => $fecha,
        'check_out' => $fechaSiguiente,
    ]);

    // Reserva sin habitaciones (no asignada)
    Reserva::create([
        'localizador' => 'LOC2',
        'reservable_id' => $cliente->id,
        'reservable_type' => Cliente::class,
        'check_in' => $fecha,
        'check_out' => $fechaSiguiente,
        'precio_total' => 80,
    ]);

    $response = $this->actingAs($user)
        ->getJson('/panel/estadisticas/ocupacion?fecha_desde=' . $fecha . '&fecha_hasta=' . $fecha);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'total_habitaciones',
                'total_por_tipo' => ['doble', 'familiar', 'suite'],
                'por_dia' => [
                    ['fecha', 'por_tipo' => ['doble' => ['ocupadas', 'porcentaje'], 'familiar' => ['ocupadas', 'porcentaje'], 'suite' => ['ocupadas', 'porcentaje']], 'ocupadas', 'porcentaje_ocupacion']
                ],
                'promedio_porcentaje_ocupacion',
                'promedio_porcentaje_ocupacion_por_tipo',
                'fecha_desde',
                'fecha_hasta',
            ],
        ]);

    $json = $response->json('data');

    // Totales por tipo
    expect($json['total_por_tipo']['doble'])->toBe(2);
    expect($json['total_por_tipo']['familiar'])->toBe(0);
    expect($json['total_por_tipo']['suite'])->toBe(0);

    // Por día: la primera fecha
    expect(count($json['por_dia']))->toBe(1);
    $fila = $json['por_dia'][0];

    // Doble: 1 ocupada (asignada) de 2 => 50%
    expect($fila['por_tipo']['doble']['ocupadas'])->toBe(1);
    expect($fila['por_tipo']['doble']['porcentaje'])->toBe(50.0);

    // Familiar y Suite a 0
    expect($fila['por_tipo']['familiar']['ocupadas'])->toBe(0);
    expect($fila['por_tipo']['suite']['ocupadas'])->toBe(0);

    // Total ocupadas incluye reserva sin habitaciones (1 asignada + 1 sin asignar)
    expect($fila['ocupadas'])->toBe(2);
});
