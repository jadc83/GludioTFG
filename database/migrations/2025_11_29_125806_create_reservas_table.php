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
        Schema::create('reservas', function (Blueprint $table) {
            $table->id();
            $table->string('localizador')->unique();
            $table->morphs('reservable');
            $table->date('check_in');
            $table->date('check_out');
            $table->decimal('precio_total', 10, 2);
            $table->enum('status', ['pendiente', 'confirmado', 'checked_in', 'checked_out', 'cancelado', 'no_presentado'])->default('pendiente');
            $table->enum('pago', ['pendiente', 'pagado', 'parcial', 'devuelto'])->default('pendiente');
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservas');
    }
};
