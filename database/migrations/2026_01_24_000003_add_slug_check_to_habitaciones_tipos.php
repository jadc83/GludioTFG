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
        Schema::table('habitaciones_tipos', function (Blueprint $table) {
            if (! Schema::hasColumn('habitaciones_tipos', 'slug')) {
                $table->string('slug')->nullable()->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('habitaciones_tipos', function (Blueprint $table) {
            if (Schema::hasColumn('habitaciones_tipos', 'slug')) {
                $table->dropColumn('slug');
            }
        });
    }
};
