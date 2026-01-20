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
        if (Schema::hasColumn('habitaciones', 'precio_noche')) {
            Schema::table('habitaciones', function (Blueprint $table) {
                $table->dropColumn('precio_noche');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('habitaciones', function (Blueprint $table) {
            $table->decimal('precio_noche', 8, 2)->after('tipo')->nullable();
        });
    }
};
