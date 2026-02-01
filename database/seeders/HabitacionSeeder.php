<?php

namespace Database\Seeders;

use App\Models\Habitacion;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HabitacionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Habitaciones distribuidas en 3 plantas
        // Planta 1 (100-120): 21 habitaciones dobles
        // Planta 2 (200-220): 21 habitaciones suite
        // Planta 3 (300-320): 21 habitaciones familiar

        $habitaciones = [];

        // PLANTA 1: 100-120 (Dobles)
        for ($i = 100; $i <= 120; $i++) {
            $habitaciones[] = [
                'numero' => (string)$i,
                'tipo' => 'doble',
                'capacidad' => 2,
                'descripcion' => "Habitación doble planta 1 - Nº {$i}",
                'estado' => 'disponible'
            ];
        }

        // PLANTA 2: 200-220 (Suite)
        for ($i = 200; $i <= 220; $i++) {
            $habitaciones[] = [
                'numero' => (string)$i,
                'tipo' => 'suite',
                'capacidad' => 2,
                'descripcion' => "Suite planta 2 - Nº {$i}",
                'estado' => 'disponible'
            ];
        }

        // PLANTA 3: 300-320 (Familiar)
        for ($i = 300; $i <= 320; $i++) {
            $habitaciones[] = [
                'numero' => (string)$i,
                'tipo' => 'familiar',
                'capacidad' => 4,
                'descripcion' => "Habitación familiar planta 3 - Nº {$i}",
                'estado' => 'disponible'
            ];
        }

        // Insertar todas las habitaciones
        foreach ($habitaciones as $habitacion) {
            Habitacion::create($habitacion);
        }
    }
}

