<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Normalizar posibles estados antiguos antes de actualizar el constraint
        DB::statement("UPDATE reservas SET status = 'en_estancia' WHERE status = 'checked_in';");
        DB::statement("UPDATE reservas SET status = 'finalizado' WHERE status = 'checked_out';");

        DB::statement("ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_status_check;");
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
                    'reembolso_total_pendiente',
                    'reembolso_parcial_confirmado'
                )
            )
        ;");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_status_check;");
        DB::statement("
            ALTER TABLE reservas ADD CONSTRAINT reservas_status_check CHECK (
                status IN ('pendiente', 'pagado', 'confirmado', 'en_estancia', 'finalizado', 'cancelado')
            )
        ;");

        // Revertir los nombres si se necesita retroceder la migración
        DB::statement("UPDATE reservas SET status = 'checked_in' WHERE status = 'en_estancia';");
        DB::statement("UPDATE reservas SET status = 'checked_out' WHERE status = 'finalizado';");
    }
};
