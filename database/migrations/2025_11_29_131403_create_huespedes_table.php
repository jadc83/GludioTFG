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
        Schema::create('huespedes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habitacion_reserva_id')->constrained('habitacion_reserva');
            $table->string('nombre');
            $table->string('apellidos');
            $table->enum('documento_tipo', ['dni', 'pasaporte', 'permiso', 'other'])->default('dni');
            $table->string('documento');
            $table->date('fecha_nacimiento')->nullable();
            $table->boolean('es_titular')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('huespedes');
    }
};
