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
            ['nombre' => 'No reembolsable', 'slug' => 'no-reembolsable', 'modificador_precio' => -20.00],
            ['nombre' => 'Reembolsable', 'slug' => 'reembolsable', 'modificador_precio' => 0.00],
            ['nombre' => 'Con desayuno', 'slug' => 'con-desayuno', 'modificador_precio' => 0.00],
            ['nombre' => 'Media pensión', 'slug' => 'media-pension', 'modificador_precio' => 15.00],
            ['nombre' => 'Oferta especial', 'slug' => 'oferta-especial', 'modificador_precio' => -10.00],
        ];

        foreach ($tarifas as $t) {
            Tarifa::updateOrCreate(
                ['slug' => $t['slug']],
                $t
            );
        }
    }
}
