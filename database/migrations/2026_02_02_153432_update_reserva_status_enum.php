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
        // Simplified: add nullable status_text column to avoid DB-specific CHECK constraints
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
