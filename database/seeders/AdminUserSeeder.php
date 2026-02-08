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
        // Intentar marcar usuario específico como admin
        $email = 'dominguezcamachojose@gmail.com';
        $user = User::where('email', $email)->first();

        if ($user) {
            // Asegurar que el rol 'admin' exista y asignarlo
            if (method_exists($user, 'assignRole')) {
                $user->assignRole('admin');
                $this->command->info("Usuario {$email} actualizado con rol admin.");
            } else {
                $this->command->info("Usuario {$email} encontrado, pero el método assignRole no está disponible.");
            }
            return;
        }

        // Si no existe, crear el usuario y asignar rol admin si es posible
        $new = User::create([
            'name' => 'Jose Dominguez',
            'email' => $email,
            'password' => Hash::make(env('ADMIN_PASSWORD', 'ChangeMe123!')),
            'tipo_documento' => 'dni',
            'numero_documento' => '00000000T',
            'nacionalidad' => 'Española',
            'direccion' => 'Dirección admin',
            'telefono' => '000000000',
        ]);

        if ($new && method_exists($new, 'assignRole')) {
            $new->assignRole('admin');
            $this->command->info("Usuario {$email} creado y asignado al rol admin.");
        } else {
            $this->command->info("Usuario {$email} creado. Asegúrate de asignar el rol 'admin' manualmente.");
        }
    }
}
