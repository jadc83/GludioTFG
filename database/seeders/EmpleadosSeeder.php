<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Empleado;
use App\Models\Departamento;
use Spatie\Permission\Models\Role;

class EmpleadosSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure canonical departments exist (no accents)
        $departamentos = ['Recepcion', 'Limpieza', 'Mantenimiento'];
        foreach ($departamentos as $name) {
            Departamento::firstOrCreate(['name' => $name]);
        }

        // Ensure roles exist
        $roles = ['admin', 'encargado', 'operario', 'auxiliar', 'user'];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r]);
        }

        // Clear existing empleados to ensure predictable seeding (keeps users intact)
        Empleado::query()->delete();

        // Create one encargado assigned to each department (one per department)
        $departamentosModels = Departamento::all()->pluck('id','name');
        $encargadosCount = 0;
        foreach ($departamentosModels as $depName => $depId) {
            $u = User::factory()->create([ 'name' => 'Encargado ' . $depName ]);
            $u->assignRole('encargado');
            Empleado::create(['user_id' => $u->id, 'departamento_id' => $depId, 'role' => 'encargado']);
            $encargadosCount++;
        }

        // Remaining employees to reach 20 total (20 - number of encargados)
        $remaining = max(0, 20 - $encargadosCount);

        // Distribution for the remaining employees (sums to remaining = 17)
        $distribution = [
            'Recepcion' => ['operario'=>6, 'auxiliar'=>2],
            'Mantenimiento' => ['operario'=>5],
            'Limpieza' => ['operario'=>4],
        ];

        foreach ($distribution as $depName => $rolesMap) {
            $depId = $departamentosModels[$depName] ?? null;
            if (! $depId) continue;

            foreach ($rolesMap as $roleName => $count) {
                for ($i=0; $i < $count; $i++) {
                    // Stop early if we've reached 20 empleados
                    if (Empleado::count() >= 20) break 2;

                    $u = User::factory()->create();
                    $assignRole = in_array($roleName, ['operario','auxiliar']) ? $roleName : 'user';
                    $u->assignRole($assignRole);
                    Empleado::create(['user_id' => $u->id, 'departamento_id' => $depId, 'role' => $roleName]);
                }
            }
        }

        // Fill with generic users if still under 20
        $totalEmpleados = Empleado::count();
        while ($totalEmpleados < 20) {
            $u = User::factory()->create();
            $u->assignRole('user');
            Empleado::create(['user_id' => $u->id, 'departamento_id' => Departamento::inRandomOrder()->first()->id, 'role' => 'user']);
            $totalEmpleados++;
        }
    }
}
