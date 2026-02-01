<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agrega índices optimizados a la tabla habitacion_reserva para mejorar
     * el rendimiento de las queries de disponibilidad que se ejecutan frecuentemente.
     */
    public function up(): void
    {
        Schema::table('habitacion_reserva', function (Blueprint $table) {
            // Índice para búsquedas por reserva (relación FK)
            // Usado en: ReservaService::asignarHabitaciones(), desasignarHabitaciones()
            $table->index(['reserva_id'], 'idx_habitacion_reserva_reserva_id');

            // Índice para búsquedas por habitación (relación FK)
            // Usado en: verificarDisponibilidad(), asignarHabitacionEnCheckIn()
            $table->index(['habitacion_id'], 'idx_habitacion_reserva_habitacion_id');

            // Índice compuesto para búsquedas de disponibilidad por rango de fechas
            // Usado en: contarHabitacionesDisponibles(), verificarDisponibilidadHabitacion()
            // Query típica: WHERE check_in < ? AND check_out > ?
            $table->index(['check_in', 'check_out'], 'idx_habitacion_reserva_check_dates');

            // Índice compuesto para búsquedas de tipo de habitación por fecha
            // Usado en: verificarDisponibilidad(), contarHabitacionesDisponibles()
            // Query típica: WHERE tipo = ? AND check_in < ? AND check_out > ?
            $table->index(['tipo', 'check_in', 'check_out'], 'idx_habitacion_reserva_tipo_dates');

            // Índice compuesto para verificación de disponibilidad de habitación específica
            // Usado en: verificarDisponibilidadHabitacion(), asignarHabitacionEnCheckIn()
            // Query típica: WHERE habitacion_id = ? AND check_in < ? AND check_out > ?
            $table->index(['habitacion_id', 'check_in', 'check_out'], 'idx_habitacion_reserva_habitacion_dates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('habitacion_reserva', function (Blueprint $table) {
            $table->dropIndex('idx_habitacion_reserva_reserva_id');
            $table->dropIndex('idx_habitacion_reserva_habitacion_id');
            $table->dropIndex('idx_habitacion_reserva_check_dates');
            $table->dropIndex('idx_habitacion_reserva_tipo_dates');
            $table->dropIndex('idx_habitacion_reserva_habitacion_dates');
        });
    }
};
