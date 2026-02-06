<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('empleados', 'numero_empleado')) {
            // SQLite doesn't support dropping columns directly; skip on sqlite to keep tests reliable.
            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                return;
            }

            Schema::table('empleados', function (Blueprint $table) {
                // Si existiera el índice unique lo eliminará automáticamente al borrar la columna
                $table->dropColumn('numero_empleado');
            });
        }
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
