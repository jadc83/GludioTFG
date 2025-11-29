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
        Schema::create('habitacion_servicio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habitacion_id')->constrained('habitaciones');
            $table->foreignId('servicio_id')->constrained('servicios');
            $table->integer('cantidad')->default(1);
            $table->date('fecha')->nullable();
            $table->time('hora')->nullable();
            $table->decimal('precio_extra', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('habitacion_servicio');
    }
};
