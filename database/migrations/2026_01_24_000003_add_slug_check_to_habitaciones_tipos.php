<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Añade una restricción CHECK para permitir sólo los slugs autorizados
        // Nota: CHECK es soportado/enforzado en MySQL 8+ y en Postgres. En versiones antiguas de MySQL puede ser ignorado.
        DB::statement("ALTER TABLE habitaciones_tipos ADD CONSTRAINT chk_habitaciones_tipos_slug CHECK (slug IN ('doble','suite','familiar'))");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement("ALTER TABLE habitaciones_tipos DROP CONSTRAINT IF EXISTS chk_habitaciones_tipos_slug");
    }
};
