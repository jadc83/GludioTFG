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
                    $u = User::find($e->user_id);
                    if ($u) {
                        $u->assignRole('encargado');
                    }
                }
            } elseif ($encargados->count() > 1) {
                // Keep the first, demote the rest to operario
                $keep = $encargados->first();
                $rest = $encargados->slice(1);
                foreach ($rest as $r) {
                    $r->update(['role' => 'operario']);
                    $u = User::find($r->user_id);
                    if ($u) {
                        // Remove encargado role if present and assign operario
                        if ($u->hasRole('encargado')) {
                            $u->removeRole('encargado');
                        }
                        if (! $u->hasRole('operario')) {
                            $u->assignRole('operario');
                        }
                    }
                }

                // Ensure keeper user has encargado role
                $uKeep = User::find($keep->user_id);
                if ($uKeep && ! $uKeep->hasRole('encargado')) {
                    $uKeep->assignRole('encargado');
                }
            }
        }

        // Final sweep: ensure empleado.role and user roles are consistent
        foreach (Empleado::all() as $e) {
            $u = User::find($e->user_id);
            if (! $u) continue;

            // sync roles: remove encargado/operario/auxiliar and assign according to empleado.role
            $possible = ['encargado','operario','auxiliar','user'];
            foreach ($possible as $r) {
                if ($u->hasRole($r) && $r !== $e->role) {
                    $u->removeRole($r);
                }
            }
            if (! $u->getRoleNames()->contains($e->role)) {
                // For 'user' role, do not assign a Spatie role named 'user' unless it exists; if not, keep no special role
                if (in_array($e->role, ['encargado','operario','auxiliar'])) {
                    $u->assignRole($e->role);
                }
            }
        }
    }
}
