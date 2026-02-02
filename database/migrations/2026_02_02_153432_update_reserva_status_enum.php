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
        DB::statement("ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_status_check");
        DB::statement("ALTER TABLE reservas ADD CONSTRAINT reservas_status_check CHECK (status IN ('pendiente', 'pagado', 'confirmado', 'en_estancia', 'finalizado', 'cancelado'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_status_check");
        DB::statement("ALTER TABLE reservas ADD CONSTRAINT reservas_status_check CHECK (status IN ('pendiente', 'confirmado', 'checked_in', 'checked_out', 'cancelado', 'no_presentado'))");
    }
};
