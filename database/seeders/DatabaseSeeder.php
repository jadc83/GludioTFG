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

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'tipo_documento' => 'dni',
            'numero_documento' => '00000000T',
            'nacionalidad' => 'Española',
            'direccion' => 'Dirección de prueba',
            'telefono' => '600000000'
        ]);

        // Asegurar que al menos un admin exista para pruebas
        $this->call(\Database\Seeders\AdminUserSeeder::class);
    }
}
