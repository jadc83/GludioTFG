<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Departamento;

class DepartamentosSeeder extends Seeder
{
    public function run(): void
    {
        // Usar los nombres canónicos ya normalizados para evitar conflictos
        Departamento::firstOrCreate(['name' => 'Mantenimiento']);
        Departamento::firstOrCreate(['name' => 'Recepcion']);
        Departamento::firstOrCreate(['name' => 'Limpieza']);
    }
}
