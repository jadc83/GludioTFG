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
        // 50 habitaciones: 20 dobles, 15 suite, 15 familiar
        $habitaciones = [
            // Dobles (20 habitaciones)
            ['numero' => '107', 'tipo' => 'doble', 'precio_noche' => 99.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con vista al mar', 'estado' => 'disponible'],
            ['numero' => '108', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con aire acondicionado', 'estado' => 'disponible'],
            ['numero' => '109', 'tipo' => 'doble', 'precio_noche' => 94.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con bañera', 'estado' => 'disponible'],
            ['numero' => '110', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble estándar', 'estado' => 'disponible'],
            ['numero' => '111', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con decoración moderna', 'estado' => 'ocupada'],
            ['numero' => '112', 'tipo' => 'doble', 'precio_noche' => 99.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con jacuzzi', 'estado' => 'disponible'],
            ['numero' => '113', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con ventanas amplias', 'estado' => 'disponible'],
            ['numero' => '114', 'tipo' => 'doble', 'precio_noche' => 94.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con terraza', 'estado' => 'mantenimiento'],
            ['numero' => '115', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con servicio de habitación 24h', 'estado' => 'disponible'],
            ['numero' => '116', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con TV de pantalla plana', 'estado' => 'disponible'],
            ['numero' => '117', 'tipo' => 'doble', 'precio_noche' => 99.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble deluxe', 'estado' => 'disponible'],
            ['numero' => '118', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con conexión Wi-Fi', 'estado' => 'disponible'],
            ['numero' => '119', 'tipo' => 'doble', 'precio_noche' => 94.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble con cama king size', 'estado' => 'disponible'],
            ['numero' => '120', 'tipo' => 'doble', 'precio_noche' => 89.99, 'capacidad' => 2, 'descripcion' => 'Habitación doble confortables', 'estado' => 'disponible'],

            // Suite (15 habitaciones)
            ['numero' => '201', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con sala de estar y dormitorio separado', 'estado' => 'disponible'],
            ['numero' => '202', 'tipo' => 'suite', 'precio_noche' => 159.99, 'capacidad' => 4, 'descripcion' => 'Suite ejecutiva con vistas panorámicas', 'estado' => 'disponible'],
            ['numero' => '203', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con jacuzzi privado', 'estado' => 'disponible'],
            ['numero' => '204', 'tipo' => 'suite', 'precio_noche' => 169.99, 'capacidad' => 4, 'descripcion' => 'Suite presidencial con terraza', 'estado' => 'ocupada'],
            ['numero' => '205', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con minibar completo', 'estado' => 'disponible'],
            ['numero' => '206', 'tipo' => 'suite', 'precio_noche' => 159.99, 'capacidad' => 4, 'descripcion' => 'Suite con sauna privada', 'estado' => 'disponible'],
            ['numero' => '207', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con acceso a gym privado', 'estado' => 'disponible'],
            ['numero' => '208', 'tipo' => 'suite', 'precio_noche' => 159.99, 'capacidad' => 4, 'descripcion' => 'Suite con cocina americana', 'estado' => 'disponible'],
            ['numero' => '209', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con bañera de hidromasaje', 'estado' => 'limpieza'],
            ['numero' => '210', 'tipo' => 'suite', 'precio_noche' => 169.99, 'capacidad' => 4, 'descripcion' => 'Suite deluxe con servicio de conserjería', 'estado' => 'disponible'],
            ['numero' => '211', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con área de trabajo ejecutiva', 'estado' => 'disponible'],
            ['numero' => '212', 'tipo' => 'suite', 'precio_noche' => 159.99, 'capacidad' => 4, 'descripcion' => 'Suite con vista al atardecer', 'estado' => 'disponible'],
            ['numero' => '213', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con cama king size doble', 'estado' => 'disponible'],
            ['numero' => '214', 'tipo' => 'suite', 'precio_noche' => 159.99, 'capacidad' => 4, 'descripcion' => 'Suite con acceso a lounge exclusivo', 'estado' => 'disponible'],
            ['numero' => '215', 'tipo' => 'suite', 'precio_noche' => 149.99, 'capacidad' => 4, 'descripcion' => 'Suite con desayuno incluido', 'estado' => 'disponible'],

            // Familiar (15 habitaciones)
            ['numero' => '301', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con dos dormitorios', 'estado' => 'disponible'],
            ['numero' => '302', 'tipo' => 'familiar', 'precio_noche' => 139.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con sala de estar', 'estado' => 'disponible'],
            ['numero' => '303', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con cocina', 'estado' => 'disponible'],
            ['numero' => '304', 'tipo' => 'familiar', 'precio_noche' => 139.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con 2 baños', 'estado' => 'disponible'],
            ['numero' => '305', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con zona de juegos', 'estado' => 'ocupada'],
            ['numero' => '306', 'tipo' => 'familiar', 'precio_noche' => 139.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con terraza privada', 'estado' => 'disponible'],
            ['numero' => '307', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con aire acondicionado central', 'estado' => 'disponible'],
            ['numero' => '308', 'tipo' => 'familiar', 'precio_noche' => 139.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con servicio de niñera', 'estado' => 'disponible'],
            ['numero' => '309', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con camas dobles y individuales', 'estado' => 'mantenimiento'],
            ['numero' => '310', 'tipo' => 'familiar', 'precio_noche' => 139.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con access a piscina infantil', 'estado' => 'disponible'],
            ['numero' => '311', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con mini bar', 'estado' => 'disponible'],
            ['numero' => '312', 'tipo' => 'familiar', 'precio_noche' => 139.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con smart TV', 'estado' => 'disponible'],
            ['numero' => '313', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con balcones', 'estado' => 'disponible'],
            ['numero' => '314', 'tipo' => 'familiar', 'precio_noche' => 139.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con conexión rápida', 'estado' => 'disponible'],
            ['numero' => '315', 'tipo' => 'familiar', 'precio_noche' => 129.99, 'capacidad' => 6, 'descripcion' => 'Habitación familiar con estacionamiento incluido', 'estado' => 'disponible'],
        ];

        foreach ($habitaciones as $habitacion) {
            Habitacion::create($habitacion);
        }
    }
}

