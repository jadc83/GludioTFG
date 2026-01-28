<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Preferir actualizar el primer usuario existente a admin para evitar duplicados
        $user = User::first();
        if ($user) {
            // Keep existing user as-is (no admin flag)
            return;
        }

        // Si no hay usuarios, crear uno con credenciales por defecto (ajustar en .env)
        User::create([
            'name' => 'Admin',
            'email' => env('ADMIN_EMAIL', 'admin@example.com'),
            'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
            'tipo_documento' => 'dni',
            'numero_documento' => '00000000T',
            'nacionalidad' => 'Española',
            'direccion' => 'Dirección admin',
            'telefono' => '000000000',
        ]);
    }
}
