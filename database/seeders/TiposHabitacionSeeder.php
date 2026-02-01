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
            [
                'slug' => 'doble',
                'nombre' => 'Doble',
                'capacidad' => 2,
                'precio_base' => '90.00',
                'image_links' => json_encode([
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80',
                ])
            ],
            [
                'slug' => 'suite',
                'nombre' => 'Suite',
                'capacidad' => 4,
                'precio_base' => '150.00',
                'image_links' => json_encode([
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80',
                ])
            ],
            [
                'slug' => 'familiar',
                'nombre' => 'Familiar',
                'capacidad' => 6,
                'precio_base' => '110.00',
                'image_links' => json_encode([
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop&q=80',
                ])
            ],
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
