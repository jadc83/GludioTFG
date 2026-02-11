<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear el rol admin si no existe
        Role::findOrCreate('admin', 'web');

        // Crear el usuario admin con todos los campos obligatorios
        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@hotel.com',
            'password' => bcrypt('josejose'),
            'tipo_documento' => 'dni',
            'numero_documento' => '00000000A',
            'nacionalidad' => 'Española',
            'direccion' => 'Calle Admin 1',
            'ciudad' => 'Madrid',
            'codigo_postal' => '28001',
            'telefono' => '600000000',
            'email_verified_at' => now(),
        ]);

        // Asignar el rol admin
        $admin->assignRole('admin');
    }
}
