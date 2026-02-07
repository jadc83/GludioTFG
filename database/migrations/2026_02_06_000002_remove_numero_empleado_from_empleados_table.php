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
                $colsSql = implode(', ', array_map(function ($c) { return '"'.str_replace('"', '""', $c).'"'; }, $copyColumns));

                // Create temporary table with same columns (no rows)
                DB::statement("CREATE TABLE empleados_tmp AS SELECT $colsSql FROM empleados WHERE 0");

                // Copy rows into temporary table
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
