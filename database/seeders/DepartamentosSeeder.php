<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Departamento;

class DepartamentosSeeder extends Seeder
{
    public function run(): void
    {
        Departamento::firstOrCreate(['name' => 'mantenimiento']);
        Departamento::firstOrCreate(['name' => 'recepcion']);
        Departamento::firstOrCreate(['name' => 'limpieza']);
    }
}
