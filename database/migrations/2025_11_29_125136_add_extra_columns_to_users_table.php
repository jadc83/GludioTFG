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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('tipo_documento', ['dni', 'pasaporte', 'tie']);
            $table->string('numero_documento')->unique();
            $table->string('nacionalidad');
            $table->text('direccion');
            $table->string('telefono');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_documento',
                'numero_documento',
                'nacionalidad',
                'direccion',
                'telefono'
            ]);
        });
    }
};
