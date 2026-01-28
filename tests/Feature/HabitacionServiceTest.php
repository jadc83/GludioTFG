<?php

use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Reserva;
use App\Services\HabitacionService;
use Carbon\Carbon;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('counts available rooms by type excluding maintenance and overlapping reservations', function () {
    // Create habitaciones
    $hb1 = Habitacion::create(['numero' => '101', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);
    $hb2 = Habitacion::create(['numero' => '102', 'tipo' => 'doble', 'capacidad' => 2, 'estado' => 'disponible']);
    $hb3 = Habitacion::create(['numero' => '103', 'tipo' => 'doble', 'capacidad' => 3, 'estado' => 'mantenimiento']);
    $hb4 = Habitacion::create(['numero' => '201', 'tipo' => 'suite', 'capacidad' => 4, 'estado' => 'disponible']);

    // Create a reserva that overlaps with hb2 to block it
    $reserva = Reserva::create(['localizador' => 'TEST1', 'check_in' => '2026-01-12', 'check_out' => '2026-01-13', 'status' => 'confirmada']);

    HabitacionReserva::create([
        'reserva_id' => $reserva->id,
        'habitacion_id' => $hb2->id,
        'precio' => 100,
        'check_in' => '2026-01-12',
        'check_out' => '2026-01-13',
        'tipo' => 'doble',
    ]);

    $checkIn = Carbon::parse('2026-01-10');
    $checkOut = Carbon::parse('2026-01-15');

    $service = new HabitacionService();

    $resumen = $service->contarDisponiblesPorTipo($checkIn, $checkOut);

    expect($resumen['doble']['cantidad'])->toBe(1);
    expect($resumen['doble']['capacidadMaxima'])->toBe(2);
    expect($resumen['suite']['cantidad'])->toBe(1);
});
