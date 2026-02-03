<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Actualiza la restricción CHECK de pagos para incluir nuevos estados de reembolso
     * Estados agregados: reembolso_parcial_procesado, devuelto, reembolso_pendiente
     */
    public function up(): void
    {
        // Añade una columna para detallar el estado de reembolso (compatible con sqlite)
        Schema::table('pagos', function (Blueprint $table) {
            if (! Schema::hasColumn('pagos', 'reembolso_estado')) {
                $table->string('reembolso_estado')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            if (Schema::hasColumn('pagos', 'reembolso_estado')) {
                $table->dropColumn('reembolso_estado');
            }
        });
    }
};
