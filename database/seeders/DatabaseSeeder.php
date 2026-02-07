<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Ensure test user exists (idempotent)
        \App\Models\User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'tipo_documento' => 'dni',
                'numero_documento' => '00000000T',
                'nacionalidad' => 'Española',
                'direccion' => 'Dirección de prueba',
                'telefono' => '600000000',
                'password' => bcrypt('password'),
            ]
        );

        // Asegurar que existan roles y permisos antes de crear un admin
        $this->call(\Database\Seeders\RolesAndPermissionsSeeder::class);
        // Normalize and canonicalize departamentos first, then seed empleados
        $this->call(\Database\Seeders\NormalizeDepartamentosSeeder::class);
        $this->call(\Database\Seeders\EmpleadosSeeder::class);
        // Fix: ensure one encargado per departamento and sync roles
        $this->call(\Database\Seeders\FixEncargadosSeeder::class);

        // Crear roles sencillos para el hotel (mantenimiento, recepcion, limpieza)
        $this->call(\Database\Seeders\HotelRolesSeeder::class);

        // Crear departamentos base y mapear datos antiguos
        $this->call(\Database\Seeders\DepartamentosSeeder::class);

        // Crear admin específico solicitado (idempotente)
        $j = \App\Models\User::firstOrCreate(
            ['email' => 'joseantonio.dominguez@iesdonana.org'],
            [
                'name' => 'Jose Antonio Dominguez Camacho',
                'tipo_documento' => 'dni',
                'numero_documento' => '49035685f',
                'nacionalidad' => 'Española',
                'direccion' => 'Salto del grillo 62',
                'telefono' => '672658102',
                'password' => bcrypt('josejose'),
            ]
        );
        $j->assignRole('admin');

        // Asegurar que al menos un admin exista para pruebas
        $this->call(\Database\Seeders\AdminUserSeeder::class);
        $this->call(\Database\Seeders\TiposHabitacionSeeder::class);
        $this->call(\Database\Seeders\TarifasSeeder::class);
        $this->call(\Database\Seeders\HabitacionSeeder::class);
        $this->call(\Database\Seeders\ClienteSeeder::class);
        $this->call(\Database\Seeders\CuponSeeder::class);
    }
}
