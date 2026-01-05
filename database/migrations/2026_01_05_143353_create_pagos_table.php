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
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reserva_id')->constrained('reservas');
            $table->string('stripe_payment_intent_id')->unique();
            $table->decimal('monto', 10, 2);
            $table->string('moneda')->default('eur');
            $table->enum('estado', ['pendiente', 'procesando', 'completado', 'fallido', 'cancelado'])->default('pendiente');
            $table->text('descripcion')->nullable();
            $table->json('stripe_response')->nullable();
            $table->timestamp('pagado_en')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
