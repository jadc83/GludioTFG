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
        Schema::table('habitacion_reserva', function (Blueprint $table) {
            if (Schema::hasColumn('habitacion_reserva', 'asignada_en')) {
                $table->dropColumn('asignada_en');
            }
            if (Schema::hasColumn('habitacion_reserva', 'asignada_por')) {
                $table->dropColumn('asignada_por');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('habitacion_reserva', function (Blueprint $table) {
            if (!Schema::hasColumn('habitacion_reserva', 'asignada_en')) {
                $table->timestamp('asignada_en')->nullable()->after('tipo');
            }
            if (!Schema::hasColumn('habitacion_reserva', 'asignada_por')) {
                $table->unsignedBigInteger('asignada_por')->nullable()->after('asignada_en');
            }
        });
    }
};
