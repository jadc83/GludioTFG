<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Recreate the check constraint including the 'reembolsado' state
        DB::statement("ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_estado_check;");
        DB::statement("ALTER TABLE pagos ADD CONSTRAINT pagos_estado_check CHECK (estado IN ('pendiente','procesando','completado','fallido','cancelado','reembolsado'));" );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore previous constraint without 'reembolsado'
        DB::statement("ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_estado_check;");
        DB::statement("ALTER TABLE pagos ADD CONSTRAINT pagos_estado_check CHECK (estado IN ('pendiente','procesando','completado','fallido','cancelado'));" );
    }
};
