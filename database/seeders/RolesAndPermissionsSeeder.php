<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar caché de permissions
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Permisos de ejemplo (puedes añadir más si lo necesitas)
        Permission::firstOrCreate(['name' => 'manage users']);
        Permission::firstOrCreate(['name' => 'view reports']);

        // Roles
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $user = Role::firstOrCreate(['name' => 'user']);

        // Asignar permisos básicos al admin
        $admin->givePermissionTo(['manage users', 'view reports']);

        // Asignar rol admin al usuario de prueba si existe
        $u = User::where('email', 'test@example.com')->first();
        if ($u) {
            $u->assignRole($admin);
        }
    }
}
