<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('empleados', 'numero_empleado')) {
            return;
        }

        // SQLite does not support DROP COLUMN; recreate table and copy data safely using SQL
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            $existing = Schema::getColumnListing('empleados');
            $copyColumns = array_values(array_diff($existing, ['numero_empleado']));

            if (!empty($copyColumns)) {
                // Create a temp table preserving the primary key and all existing columns (generic types)
                $colsDef = [];
                $colsToCreate = array_filter($copyColumns, fn($c) => $c !== 'id');

                foreach ($colsToCreate as $col) {
                    // Heuristic typing: common foreign keys as INTEGER, timestamps/text otherwise
                    if (in_array($col, ['user_id', 'departamento_id', 'numero_empleado'])) {
                        $colsDef[] = '"'.$col.'" INTEGER';
                    } else {
                        $colsDef[] = '"'.$col.'" TEXT';
                    }
                }

                $colsSql = implode(', ', array_map(function ($c) { return '"'.str_replace('"', '""', $c).'"'; }, $copyColumns));

                // If id exists in the original columns, include it in CREATE TABLE; otherwise create it as primary key
                $createCols = '';
                if (in_array('id', $copyColumns)) {
                    // keep original id column and make it PRIMARY KEY
                    $createCols = '"id" INTEGER PRIMARY KEY, ' . implode(', ', $colsDef);
                } else {
                    $createCols = '"id" INTEGER PRIMARY KEY, ' . implode(', ', $colsDef);
                }

                DB::statement("CREATE TABLE empleados_tmp ($createCols)");

                // Copy rows into temporary table preserving ids when present
                DB::statement("INSERT INTO empleados_tmp ($colsSql) SELECT $colsSql FROM empleados");

                Schema::drop('empleados');
                Schema::rename('empleados_tmp', 'empleados');
            }

            return;
        }

        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn('numero_empleado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->string('numero_empleado')->unique();
        });
    }
};
