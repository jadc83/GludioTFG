<?php

use Illuminate\Database\Migrations\Migration;
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
        // Para PostgreSQL: cambiar enum a varchar con CHECK constraint
        DB::statement("ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_status_check;");

        // Primero actualizar valores antiguos a nuevos nombres ANTES de cambiar el tipo
        DB::statement("UPDATE reservas SET status = 'en_estancia' WHERE status = 'checked_in';");
        DB::statement("UPDATE reservas SET status = 'finalizado' WHERE status = 'checked_out';");

        // Cambiar columna status de enum a varchar
        DB::statement("ALTER TABLE reservas ALTER COLUMN status TYPE varchar(50);");

        // Agregar nuevo constraint CHECK con todos los estados válidos
        DB::statement("
            ALTER TABLE reservas ADD CONSTRAINT reservas_status_check CHECK (
                status IN (
                    'pendiente',
                    'confirmado',
                    'en_estancia',
                    'finalizado',
                    'cancelado',
                    'no_presentado',
                    'reembolso_parcial_pendiente',
                    'reembolso_total_pendiente'
                )
            );
        ");

        // Actualizar columna pago
        DB::statement("ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_pago_check;");

        // Actualizar valores antiguos si los hay
        DB::statement("UPDATE reservas SET pago = 'reembolso_parcial_procesado' WHERE pago = 'parcial';");

        DB::statement("ALTER TABLE reservas ALTER COLUMN pago TYPE varchar(50);");
        DB::statement("
            ALTER TABLE reservas ADD CONSTRAINT reservas_pago_check CHECK (
                pago IN (
                    'pendiente',
                    'pagado',
                    'parcial',
                    'devuelto',
                    'reembolso_parcial_procesado',
                    'reembolso_pendiente'
                )
            );
        ");
    }

    public function down(): void
    {
        // No revertir - estos cambios son críticos y irreversibles con datos existentes
        // Las migraciones 003 y 004 deben mantenerse
    }
};
