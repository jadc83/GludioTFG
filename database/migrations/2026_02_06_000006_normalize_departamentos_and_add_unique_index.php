<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::beginTransaction();
        try {
            // 1) Group departamentos by lowercased name
            $rows = DB::table('departamentos')->select('id', 'name')->get();
            $groups = [];
            foreach ($rows as $r) {
                $key = mb_strtolower(trim($r->name ?? ''));
                if ($key === '') continue;
                $groups[$key][] = $r;
            }

            // 2) For each group, pick canonical (lowest id), reassign empleados and delete duplicates
            foreach ($groups as $key => $items) {
                usort($items, function ($a, $b) { return $a->id <=> $b->id; });
                $canonical = array_shift($items); // keeps first as canonical
                // Normalize canonical name to Capitalized words
                $normalized = mb_convert_case(mb_strtolower($canonical->name), MB_CASE_TITLE, "UTF-8");
                DB::table('departamentos')->where('id', $canonical->id)->update(['name' => $normalized]);

                foreach ($items as $dup) {
                    // reassign empleados
                    DB::table('empleados')->where('departamento_id', $dup->id)->update(['departamento_id' => $canonical->id]);
                    // delete duplicate departamento
                    DB::table('departamentos')->where('id', $dup->id)->delete();
                }
            }

            // 3) Ensure any remaining name is normalized (capitalized)
            DB::table('departamentos')->get()->each(function ($r) {
                $normalized = mb_convert_case(mb_strtolower($r->name), MB_CASE_TITLE, "UTF-8");
                if ($normalized !== $r->name) {
                    DB::table('departamentos')->where('id', $r->id)->update(['name' => $normalized]);
                }
            });

            // 4) Create unique index on lower(name) to prevent case-insensitive duplicates (Postgres)
            // Use IF NOT EXISTS to avoid errors if already created
            // This statement is for Postgres. For MySQL users, you may need a different approach.
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS departamentos_name_lower_idx ON departamentos (LOWER(name));');

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the unique index if exists
        DB::statement('DROP INDEX IF EXISTS departamentos_name_lower_idx');
    }
};
