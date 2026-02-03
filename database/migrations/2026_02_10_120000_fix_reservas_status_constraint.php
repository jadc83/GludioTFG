<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Simplified: add nullable helper columns to avoid DB-specific constraints and value updates
        Schema::table('reservas', function (Blueprint $table) {
            if (! Schema::hasColumn('reservas', 'status_text')) {
                $table->string('status_text')->nullable()->index();
            }
            if (! Schema::hasColumn('reservas', 'pago_text')) {
                $table->string('pago_text')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            if (Schema::hasColumn('reservas', 'status_text')) {
                $table->dropColumn('status_text');
            }
            if (Schema::hasColumn('reservas', 'pago_text')) {
                $table->dropColumn('pago_text');
            }
        });
    }
};
