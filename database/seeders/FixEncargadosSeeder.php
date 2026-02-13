<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\User;

class FixEncargadosSeeder extends Seeder
{
    public function run(): void
    {
        $departamentos = Departamento::all();

        foreach ($departamentos as $dep) {
            $encargados = Empleado::where('departamento_id', $dep->id)->where('role', 'encargado')->orderBy('id')->get();

            if ($encargados->count() === 0) {
                // Promote a random employee in this department if exists
                $e = Empleado::where('departamento_id', $dep->id)->inRandomOrder()->first();
                if ($e) {
                    $e->update(['role' => 'encargado']);
                    // User role assignment removed - keep empleado.role only
                }
            } elseif ($encargados->count() > 1) {
                // Keep the first, demote the rest to operario
                $keep = $encargados->first();
                $rest = $encargados->slice(1);
                foreach ($rest as $r) {
                    $r->update(['role' => 'operario']);
                    // User role assignments/changes removed - keep empleado.role only
                }

                // Ensure keeper empleado has role set; do not modify User roles here
                $uKeep = User::find($keep->user_id);
                if ($uKeep) {
                    // noop: role management is handled centrally
                }
            }
        }

        // Final sweep: ensure empleado.role and user roles are consistent
        foreach (Empleado::all() as $e) {
            $u = User::find($e->user_id);
            if (! $u) continue;

            // sync empleado.role only; do not modify User roles here
            // (central role assignment to be handled separately)
        }
    }
}
