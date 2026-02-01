<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mejora el sistema de reembolsos:
     * - Agrega columna para rastrear si hay reembolsos pendientes en la reserva
     * - Agrega índices para mejorar performance en queries de reembolsos
     * - Mejora la estructura de RefundRequest para mejor tracking
     */
    public function up()
    {
        // Mejorar tabla reembolsos con mejor indexación y metadata
        if (Schema::hasTable('reembolsos')) {
            Schema::table('reembolsos', function (Blueprint $table) {
                // Agregar índices si no existen
                if (!Schema::hasColumn('reembolsos', 'refund_type')) {
                    $table->string('refund_type')->nullable()->default('parcial')->comment('parcial o completo');
                }
                if (!Schema::hasColumn('reembolsos', 'request_id')) {
                    $table->foreignId('request_id')->nullable()->constrained('refund_requests')->onDelete('set null');
                }

                // Índices para búsquedas rápidas
                $table->index(['reserva_id', 'status']);
                $table->index(['status', 'created_at']);
            });
        }

        // Mejorar tabla refund_requests para mejor tracking
        if (Schema::hasTable('refund_requests')) {
            Schema::table('refund_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('refund_requests', 'processed_refund_amount_cents')) {
                    $table->bigInteger('processed_refund_amount_cents')->nullable()->comment('Monto realmente procesado por Stripe');
                }

                // Índices para búsquedas
                $table->index(['reserva_id', 'status']);
                $table->index(['status', 'created_at']);
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('reembolsos')) {
            Schema::table('reembolsos', function (Blueprint $table) {
                $table->dropColumnIfExists('refund_type');
                $table->dropColumnIfExists('request_id');
                $table->dropIndex(['reserva_id', 'status']);
                $table->dropIndex(['status', 'created_at']);
            });
        }

        if (Schema::hasTable('refund_requests')) {
            Schema::table('refund_requests', function (Blueprint $table) {
                $table->dropColumnIfExists('processed_refund_amount_cents');
                $table->dropIndex(['reserva_id', 'status']);
                $table->dropIndex(['status', 'created_at']);
            });
        }
    }
};
