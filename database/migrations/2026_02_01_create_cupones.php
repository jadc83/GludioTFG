<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cupones', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->enum('tipo', ['porcentaje', 'monto_fijo']);
            $table->decimal('valor', 10, 2);
            $table->integer('usos_maximos')->nullable();
            $table->integer('usos_realizados')->default(0);
            $table->timestamp('fecha_inicio');
            $table->timestamp('fecha_fin');
            $table->boolean('activo')->default(true);
            $table->string('descripcion')->nullable();
            $table->timestamps();

            $table->index('codigo');
            $table->index('activo');
        });

        Schema::create('cupones_aplicados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reserva_id')->constrained('reservas')->onDelete('cascade');
            $table->foreignId('cupon_id')->constrained('cupones')->onDelete('cascade');
            $table->string('codigo');
            $table->decimal('descuento_aplicado', 10, 2);
            $table->string('usuario_email')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();

            $table->unique(['reserva_id', 'cupon_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupones_aplicados');
        Schema::dropIfExists('cupones');
    }
};
