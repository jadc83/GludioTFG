<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->foreignId('cupon_id')->nullable()->constrained('cupones')->onDelete('set null');
            $table->decimal('descuento_aplicado', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['cupon_id']);
            $table->dropColumn(['cupon_id', 'descuento_aplicado']);
        });
    }
};
