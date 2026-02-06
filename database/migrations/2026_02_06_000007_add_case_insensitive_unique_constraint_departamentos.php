<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'])) {
            // MySQL/MariaDB: add stored generated column and unique index on it
            // Use VARCHAR(191) to be safe with older MySQL versions
            $hasColumn = Schema::hasColumn('departamentos', 'name_ci');
            if (! $hasColumn) {
                DB::statement("ALTER TABLE departamentos ADD COLUMN name_ci VARCHAR(191) AS (LOWER(name)) STORED");
            }
            // create index if not exists
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS departamentos_name_ci_unique ON departamentos (name_ci)");
        } elseif ($driver === 'sqlite') {
            // SQLite supports expression indexes in recent versions
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS departamentos_name_lower_idx ON departamentos (LOWER(name))");
        } else {
            // Postgres and others: create unique index on lower(name)
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS departamentos_name_lower_idx ON departamentos (LOWER(name))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'])) {
            DB::statement("DROP INDEX IF EXISTS departamentos_name_ci_unique");
            if (Schema::hasColumn('departamentos', 'name_ci')) {
                Schema::table('departamentos', function (Blueprint $table) {
                    $table->dropColumn('name_ci');
                });
            }
        } else {
            DB::statement("DROP INDEX IF EXISTS departamentos_name_lower_idx");
        }
    }
};
