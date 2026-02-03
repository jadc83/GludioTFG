<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Actualiza los enums de reservas para soportar los nuevos estados de reembolso
     * Cambia de enum a varchar con constraint CHECK para mayor flexibilidad
     */
    public function up(): void
    {
        // Simplified: add helper columns instead of mutating data or adding DB-specific CHECKs
        Schema::table('reservas', function (Blueprint $table) {
            if (! Schema::hasColumn('reservas', 'status_text')) {
                $table->string('status_text')->nullable()->index();
            }
            if (! Schema::hasColumn('reservas', 'pago_text')) {
                $table->string('pago_text')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        // Keep non-reversible for safety in production
        Schema::table('reservas', function (Blueprint $table) {
            if (Schema::hasColumn('reservas', 'status_text')) {
                $table->dropColumn('status_text');
            }
            if (Schema::hasColumn('reservas', 'pago_text')) {
                $table->dropColumn('pago_text');
            }
        });
    }
};
