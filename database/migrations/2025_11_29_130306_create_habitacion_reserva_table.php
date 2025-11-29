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
        Schema::create('habitacion_reserva', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reserva_id')->constrained();
            $table->foreignId('habitacion_id')->constrained('habitaciones');
            $table->decimal('precio', 10, 2);
            $table->date('check_in')->nullable();
            $table->date('check_out')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('habitacion_reserva');
    }
};
