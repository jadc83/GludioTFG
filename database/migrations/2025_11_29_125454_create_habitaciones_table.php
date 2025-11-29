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
        Schema::create('habitaciones', function (Blueprint $table) {
        $table->id();
        $table->string('numero')->unique();
        $table->enum('tipo', ['doble', 'suite', 'familiar']);
        $table->decimal('precio_noche', 8, 2);
        $table->integer('capacidad');
        $table->enum('estado', ['disponible', 'ocupada', 'mantenimiento', 'limpieza'])->default('disponible');
        $table->text('descripcion')->nullable();
        $table->text('notas')->nullable();
        $table->softDeletes();

        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('habitaciones');
    }
};
