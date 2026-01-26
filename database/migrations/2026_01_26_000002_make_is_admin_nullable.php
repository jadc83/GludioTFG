<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Hacer la migración segura: comprobar si la columna existe y capturar errores si ->change() no está disponible
        if (Schema::hasColumn('users', 'is_admin')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->boolean('is_admin')->nullable()->default(false)->change();
                });
            } catch (\Throwable $e) {
                // Si change() falla (p. ej. falta doctrine/dbal), no rompemos la migración
                \Illuminate\Support\Facades\Log::warning('No se pudo cambiar is_admin a nullable: ' . $e->getMessage());
            }
        }
    }

    public function down()
    {
        if (Schema::hasColumn('users', 'is_admin')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->boolean('is_admin')->nullable(false)->default(false)->change();
                });
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('No se pudo revertir is_admin nullable: ' . $e->getMessage());
            }
        }
    }
};
