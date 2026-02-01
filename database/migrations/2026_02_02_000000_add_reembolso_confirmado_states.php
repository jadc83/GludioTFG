<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Primero actualizar el constraint para incluir los nuevos estados
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
            );
        ");
    }

    public function down(): void
    {
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
                    'reembolso_total_pendiente'
                )
            );
        ");
    }
};
