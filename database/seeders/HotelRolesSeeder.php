<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class HotelRolesSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar caché de permissions/roles (seguro hacerlo antes de crear)
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Roles simples para un hotel
        Role::firstOrCreate(['name' => 'mantenimiento']);
        Role::firstOrCreate(['name' => 'recepcion']);
        Role::firstOrCreate(['name' => 'limpieza']);
    }
}
