<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cupones', function (Blueprint $table) {
            $table->integer('usos_por_usuario')->nullable()->after('usos_maximos')->comment('Máximo de veces que un usuario puede usar este cupón (NULL = ilimitado)');
        });
    }

    public function down(): void
    {
        Schema::table('cupones', function (Blueprint $table) {
            $table->dropColumn('usos_por_usuario');
        });
    }
};
