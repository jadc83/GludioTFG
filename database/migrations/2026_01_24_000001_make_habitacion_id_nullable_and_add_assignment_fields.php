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
            // Allow null habitacion_id
            $table->unsignedBigInteger('habitacion_id')->nullable()->change();

            // Add requested type, assigned timestamp and assigned by
            if (!Schema::hasColumn('habitacion_reserva', 'tipo')) {
                $table->string('tipo')->nullable()->after('habitacion_id');
            }

            if (!Schema::hasColumn('habitacion_reserva', 'asignada_en')) {
                $table->timestamp('asignada_en')->nullable()->after('tipo');
            }

            if (!Schema::hasColumn('habitacion_reserva', 'asignada_por')) {
                $table->unsignedBigInteger('asignada_por')->nullable()->after('asignada_en');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('habitacion_reserva', function (Blueprint $table) {
            // Revert nullable (be cautious: requires existing data to have no null habitacion_id)
            $table->unsignedBigInteger('habitacion_id')->nullable(false)->change();

            if (Schema::hasColumn('habitacion_reserva', 'tipo')) {
                $table->dropColumn('tipo');
            }
            if (Schema::hasColumn('habitacion_reserva', 'asignada_en')) {
                $table->dropColumn('asignada_en');
            }
            if (Schema::hasColumn('habitacion_reserva', 'asignada_por')) {
                $table->dropColumn('asignada_por');
            }
        });
    }
};
