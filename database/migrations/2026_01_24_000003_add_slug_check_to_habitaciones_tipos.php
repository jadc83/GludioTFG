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
        $driver = DB::connection()->getDriverName();
        $checkExpression = "(slug IN ('doble','suite','familiar'))";

        switch ($driver) {
            case 'sqlite':
                // SQLite sólo permite constraints anónimos mediante ALTER TABLE
                DB::statement("ALTER TABLE habitaciones_tipos ADD CHECK {$checkExpression}");
                break;
            case 'mysql':
                // MySQL 8+ soporta CHECK nombrados pero usa DROP CHECK para revertir
                DB::statement("ALTER TABLE habitaciones_tipos ADD CONSTRAINT chk_habitaciones_tipos_slug CHECK {$checkExpression}");
                break;
            default:
                // PostgreSQL y otros SGBD compatibles
                DB::statement("ALTER TABLE habitaciones_tipos ADD CONSTRAINT chk_habitaciones_tipos_slug CHECK {$checkExpression}");
                break;
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // No hay sintaxis DROP CHECK en SQLite; requeriría recrear la tabla.
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE habitaciones_tipos DROP CHECK chk_habitaciones_tipos_slug");
            return;
        }

        DB::statement("ALTER TABLE habitaciones_tipos DROP CONSTRAINT IF EXISTS chk_habitaciones_tipos_slug");
    }
};
