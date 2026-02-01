<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tarifa;

class TarifasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $tarifas = [
            // Régimen de comidas
            ['nombre' => 'Alojamiento', 'slug' => 'alojamiento', 'modificador_precio' => 0.00],
            ['nombre' => 'Media Pensión', 'slug' => 'media-pension', 'modificador_precio' => 35.00],
            ['nombre' => 'Pensión Completa', 'slug' => 'pension-completa', 'modificador_precio' => 60.00],
            ['nombre' => 'Todo Incluido', 'slug' => 'todo-incluido', 'modificador_precio' => 85.00],

            // Servicios adicionales
            ['nombre' => 'Catálogo de Almohadas', 'slug' => 'catalogo-almohadas', 'modificador_precio' => 15.00],
            ['nombre' => 'Spa y Bienestar', 'slug' => 'spa-bienestar', 'modificador_precio' => 45.00],
            ['nombre' => 'Acceso a Gym Premium', 'slug' => 'gym-premium', 'modificador_precio' => 20.00],
            ['nombre' => 'Servicio de Butler', 'slug' => 'servicio-butler', 'modificador_precio' => 50.00],
            ['nombre' => 'Tratamiento de Belleza', 'slug' => 'tratamiento-belleza', 'modificador_precio' => 40.00],

            // Desayunos y bebidas
            ['nombre' => 'Desayuno Continental', 'slug' => 'desayuno-continental', 'modificador_precio' => 12.00],
            ['nombre' => 'Desayuno Buffet', 'slug' => 'desayuno-buffet', 'modificador_precio' => 18.00],
            ['nombre' => 'Mini Bar Diario', 'slug' => 'minibar-diario', 'modificador_precio' => 25.00],

            // Tours y experiencias
            ['nombre' => 'City Tour', 'slug' => 'city-tour', 'modificador_precio' => 55.00],
            ['nombre' => 'Excursión Aventura', 'slug' => 'excursion-aventura', 'modificador_precio' => 75.00],
            ['nombre' => 'Cena Romántica', 'slug' => 'cena-romantica', 'modificador_precio' => 65.00],

            // Descuentos y promociones
            ['nombre' => 'Descuento Largo Plazo', 'slug' => 'descuento-largo-plazo', 'modificador_precio' => -30.00],
            ['nombre' => 'Oferta Última Hora', 'slug' => 'oferta-ultima-hora', 'modificador_precio' => -25.00],
            ['nombre' => 'Tarjeta Fidelización', 'slug' => 'tarjeta-fidelizacion', 'modificador_precio' => -15.00],
        ];

        foreach ($tarifas as $t) {
            Tarifa::updateOrCreate(
                ['slug' => $t['slug']],
                $t
            );
        }
    }
}
