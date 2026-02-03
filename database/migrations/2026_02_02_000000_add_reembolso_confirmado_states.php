<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Simplified for SQLite and tests: add a nullable status_text column to store new/legacy states
        Schema::table('reservas', function (Blueprint $table) {
            if (! Schema::hasColumn('reservas', 'status_text')) {
                $table->string('status_text')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            if (Schema::hasColumn('reservas', 'status_text')) {
                $table->dropColumn('status_text');
            }
        });
    }
};
