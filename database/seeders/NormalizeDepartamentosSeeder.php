<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Departamento;
use App\Models\Empleado;
use Illuminate\Support\Facades\DB;

class NormalizeDepartamentosSeeder extends Seeder
{
    public function run(): void
    {
        // Canonical department names (no accents)
        $canonical = [
            'recepcion' => 'Recepcion',
            'limpieza' => 'Limpieza',
            'mantenimiento' => 'Mantenimiento',
        ];

        // Map of legacy names to canonical keys
        $map = [
            'recepción' => 'recepcion',
            'recepcion' => 'recepcion',
            'recepción ' => 'recepcion',
            'administración' => 'recepcion', // Administracion -> Recepcion per agreed mapping
            'administracion' => 'recepcion',
            'cocina' => 'limpieza', // Cocina -> Limpieza per agreed mapping
            'limpieza' => 'limpieza',
            'mantenimiento' => 'mantenimiento',
        ];

        // Ensure canonical departments exist
        foreach ($canonical as $key => $name) {
            Departamento::firstOrCreate(['name' => $name]);
        }

        // Normalize existing departamentos: for each existing row, determine target canonical and move empleados
        $all = DB::table('departamentos')->get();
        foreach ($all as $row) {
            $orig = strtolower(trim($row->name));
            $targetKey = $map[$orig] ?? null;
            if (! $targetKey) {
                // If unknown, log and skip
                continue;
            }
            $targetName = $canonical[$targetKey];
            $target = Departamento::where('name', $targetName)->first();
            if (! $target) continue;

            // If it's already the canonical, ensure name is canonicalized (fix accents, casing)
            if (strtolower($row->name) === $targetKey && $row->id === $target->id) {
                // Nothing to do
                continue;
            }

            // Reassign empleados pointing to this department to the canonical department
            Empleado::where('departamento_id', $row->id)->update(['departamento_id' => $target->id]);

            // If this row is not the target, delete it
            if ($row->id !== $target->id) {
                DB::table('departamentos')->where('id', $row->id)->delete();
            }
        }

        // Finally, ensure names are canonicalized (no accents)
        foreach ($canonical as $name) {
            DB::table('departamentos')->whereRaw('lower(name) = ?', [strtolower($name)])->update(['name' => $name]);
        }
    }
}
