<?php

namespace Database\Seeders;

use App\Models\Cupon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CuponSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Cupon::create([
            'codigo' => 'BIENVENIDA10',
            'tipo' => 'porcentaje',
            'valor' => 10,
            'usos_maximos' => 50,
            'usos_realizados' => 0,
            'fecha_inicio' => now(),
            'fecha_fin' => now()->addMonths(3),
            'activo' => true,
            'descripcion' => 'Descuento de bienvenida: 10% en tu primera reserva',
        ]);

        Cupon::create([
            'codigo' => 'VERANO25',
            'tipo' => 'porcentaje',
            'valor' => 25,
            'usos_maximos' => 100,
            'usos_realizados' => 0,
            'fecha_inicio' => now(),
            'fecha_fin' => now()->addMonths(6),
            'activo' => true,
            'descripcion' => 'Descuento de verano: 25% en reservas',
        ]);

        Cupon::create([
            'codigo' => 'AHORRA15',
            'tipo' => 'porcentaje',
            'valor' => 15,
            'usos_maximos' => 200,
            'usos_realizados' => 0,
            'fecha_inicio' => now(),
            'fecha_fin' => now()->addMonths(12),
            'activo' => true,
            'descripcion' => 'Cupón de ahorro: 15% en cualquier reserva',
        ]);

        Cupon::create([
            'codigo' => 'FIJO20',
            'tipo' => 'monto_fijo',
            'valor' => 20,
            'usos_maximos' => 75,
            'usos_realizados' => 0,
            'fecha_inicio' => now(),
            'fecha_fin' => now()->addMonths(2),
            'activo' => true,
            'descripcion' => 'Descuento fijo: €20 en tu reserva',
        ]);

        Cupon::create([
            'codigo' => 'REFERRAL30',
            'tipo' => 'monto_fijo',
            'valor' => 30,
            'usos_maximos' => 500,
            'usos_realizados' => 0,
            'fecha_inicio' => now(),
            'fecha_fin' => now()->addMonths(12),
            'activo' => true,
            'descripcion' => 'Código referral: €30 de descuento',
        ]);

        Cupon::create([
            'codigo' => 'INACTIVO',
            'tipo' => 'porcentaje',
            'valor' => 50,
            'usos_maximos' => 10,
            'usos_realizados' => 5,
            'fecha_inicio' => now()->subMonth(),
            'fecha_fin' => now()->subDays(5),
            'activo' => false,
            'descripcion' => 'Cupón inactivo (para pruebas)',
        ]);
    }
}
