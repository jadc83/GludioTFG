<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TipoHabitacion;

class TiposHabitacionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $tipos = [
            ['slug' => 'doble', 'nombre' => 'Doble', 'capacidad' => 2, 'precio_base' => '90.00'],
            ['slug' => 'suite', 'nombre' => 'Suite', 'capacidad' => 4, 'precio_base' => '150.00'],
            ['slug' => 'familiar', 'nombre' => 'Familiar', 'capacidad' => 6, 'precio_base' => '110.00'],
        ];

        // Eliminar registros no permitidos para asegurar que sólo existan estos tres
        TipoHabitacion::whereNotIn('slug', array_column($tipos, 'slug'))->delete();

        foreach ($tipos as $tipo) {
            TipoHabitacion::updateOrCreate(
                ['slug' => $tipo['slug']],
                $tipo
            );
        }
    }
}
