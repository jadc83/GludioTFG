<?php

use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Reserva;
use App\Services\ReservaService;
use Carbon\Carbon;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('throws when not enough rooms are available', function () {
    $service = new ReservaService();

    // Crear solo 2 habitaciones dobles
    Habitacion::create(['numero' => 'D1', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);
    Habitacion::create(['numero' => 'D2', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);

    $checkIn = Carbon::parse('2026-02-10');
    $checkOut = Carbon::parse('2026-02-12');

    $this->expectException(\Exception::class);

    // Pedimos 3 dobles cuando solo hay 2 → debe lanzar excepción
    $service->verificarDisponibilidadMultiple([['tipo' => 'doble', 'cantidad' => 3]], $checkIn, $checkOut);
});

it('creates placeholder HabitacionReserva records when asignarHabitaciones is called', function () {
    $service = new ReservaService();

    Habitacion::create(['numero' => 'D1', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);

    $reserva = Reserva::create([
        'localizador' => 'GTEST1',
        'check_in' => '2026-03-10',
        'check_out' => '2026-03-12',
        'precio_total' => 100,
        'status' => 'pendiente',
    ]);

    $service->asignarHabitaciones($reserva, [['tipo' => 'doble', 'cantidad' => 1]]);

    $placeholders = HabitacionReserva::where('reserva_id', $reserva->id)->whereNull('habitacion_id')->get();

    expect($placeholders->count())->toBe(1);
    expect($placeholders->first()->tipo)->toBe('doble');
});

it('assigns distinct habitaciones during check-in (no duplicates)', function () {
    $service = new ReservaService();

    // Crear 3 habitaciones dobles disponibles
    $h1 = Habitacion::create(['numero' => 'D1', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);
    $h2 = Habitacion::create(['numero' => 'D2', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);
    $h3 = Habitacion::create(['numero' => 'D3', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);

    $today = Carbon::today()->toDateString();
    $tomorrow = Carbon::tomorrow()->toDateString();

    $reserva = Reserva::create([
        'localizador' => 'CHKIN1',
        'check_in' => $today,
        'check_out' => $tomorrow,
        'precio_total' => 300,
        'status' => 'pendiente',
    ]);

    // Crear 3 placeholders para la reserva
    $service->asignarHabitaciones($reserva, [['tipo' => 'doble', 'cantidad' => 3]]);

    // Ejecutar asignación física en check-in
    $results = $service->asignarHabitacionEnCheckIn($reserva);

    // Todos deberían ser 'assigned' => true
    expect(array_filter($results, fn($r) => ($r['assigned'] ?? false) === true))->toHaveCount(3);

    $assignedIds = array_map(fn($r) => $r['habitacion_id'] ?? null, $results);
    $uniqueIds = array_unique(array_filter($assignedIds));

    // Verificar que los IDs asignados sean 3 y únicos
    expect(count($uniqueIds))->toBe(3);

    // Verificar también la persistencia en la tabla habitacion_reserva
    $slots = $reserva->habitaciones()->whereNotNull('habitacion_id')->get();
    $slotIds = $slots->pluck('habitacion_id')->toArray();
    expect(count(array_unique($slotIds)))->toBe(3);
});
