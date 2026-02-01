<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Actualiza la restricción CHECK de pagos para incluir nuevos estados de reembolso
     * Estados agregados: reembolso_parcial_procesado, devuelto, reembolso_pendiente
     */
    public function up(): void
    {
        // Borrar la restricción anterior
        DB::statement("ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_estado_check;");

        // Agregar la nueva restricción con todos los estados válidos
        DB::statement("
            ALTER TABLE pagos ADD CONSTRAINT pagos_estado_check CHECK (
                estado IN (
                    'pendiente',
                    'procesando',
                    'completado',
                    'fallido',
                    'cancelado',
                    'reembolsado',
                    'reembolso_parcial_procesado',
                    'devuelto',
                    'reembolso_pendiente'
                )
            );
        ");
    }

    public function down(): void
    {
        // Restaurar a la restricción anterior
        DB::statement("ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_estado_check;");
        DB::statement("ALTER TABLE pagos ADD CONSTRAINT pagos_estado_check CHECK (estado IN ('pendiente','procesando','completado','fallido','cancelado','reembolsado'));" );
    }
};
