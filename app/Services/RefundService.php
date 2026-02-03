<?php

namespace App\Services;

use App\Models\Reserva;

/**
 * Servicio especializado en gestión de reembolsos y sus transiciones de estado
 *
 * Responsabilidades:
 * - Sincronizar estados de Reserva según reembolsos
 * - Transiciones de estado coherentes
 * - Cálculos de montos de reembolso
 * - Tracking de reembolsos parciales vs completos
 */
class RefundService
{
    /**
     * Estados posibles de Reserva relacionados con reembolsos:
     * - pendiente: sin confirmar
     * - confirmado: normal, sin reembolso
     * - reembolso_parcial_pendiente: cambio de fechas, esperando aprobación del reembolso
     * - reembolso_total_pendiente: cancelación, esperando aprobación del reembolso
     * - checked_in: check-in realizado
     * - finalizado: check-out realizado
     * - cancelado: cancelada sin reembolso o reembolso completamente procesado
     * - no_presentado: no se presentó
     */

    /**
     * Estados posibles de Pago:
     * - pendiente: sin pagar
     * - pagado: pagado normalmente
     * - reembolso_pendiente: hay reembolsos pendientes de aprobación/procesamiento
     * - reembolso_parcial_procesado: reembolso parcial ya procesado, queda saldo
     * - devuelto: reembolso completo procesado
     */

    /**
     * Sincroniza el estado de la reserva según sus reembolsos
     * Se llama después de crear, aprobar o procesar un reembolso
     *
     * @param Reserva $reserva
     * @return void
     */
    public function sincronizarEstadoReservaSegunReembolsos(Reserva $reserva): void
    {
        $reserva->load(['reembolsos', 'refundRequests', 'pagos']);

        // Calcular totales
        $precioTotal = (float)($reserva->precio_total ?? 0);
        $totalReembolsado = (float)(($reserva->reembolsos()->sum('amount_cents') ?? 0) / 100);

        // Verificar si hay RefundRequests REALMENTE pendientes (esperando aprobación)
        $refundsPendientesAprobacion = $reserva->refundRequests()
            ->where('status', 'pending')  // Solo 'pending', no 'approved'
            ->exists();

        // Lógica de transición de estado (usar solo estados válidos para la columna `status`)
        if ($refundsPendientesAprobacion) {
            // Si hay reembolsos pendientes de aprobación no forzamos estados nuevos en la tabla `reservas`:
            // dejamos el estado actual (la UI puede mostrar "Reembolso pendiente" basado en refundRequests)
            $nuevoEstado = $reserva->status;
        } else if ($totalReembolsado > 0) {
            // Reembolsos ya procesados
            if ($totalReembolsado >= $precioTotal && $precioTotal > 0) {
                // Si está completamente reembolsada, cancelar la reserva
                $nuevoEstado = 'cancelado';
            } else {
                // Reembolso parcial procesado: mantener un estado válido (confirmado)
                $nuevoEstado = 'confirmado';
            }
        } else {
            // Sin reembolsos, restaurar estado normal si veníamos de un estado temporal
            if ($reserva->status === 'reembolso_parcial_pendiente' || $reserva->status === 'reembolso_total_pendiente') {
                $nuevoEstado = 'confirmado';
            } else {
                $nuevoEstado = $reserva->status;
            }
        }

        if ($nuevoEstado !== $reserva->status) {
            $reserva->update(['status' => $nuevoEstado]);
        }
    }

    /**
     * Sincroniza el estado del pago según reembolsos
     *
     * @param \App\Models\Pago $pago
     * @return void
     */
    public function sincronizarEstadoPagoSegunReembolsos($pago): void
    {
        if (!$pago) return;

        $pago->load(['reserva', 'reembolsos']);
        $reserva = $pago->reserva;

        if (!$reserva) return;

        $precioTotal = (float)($reserva->precio_total ?? 0);
        $totalReembolsado = (float)(($reserva->reembolsos()->sum('amount_cents') ?? 0) / 100);

        // Determinar nuevo estado del pago y detalles de reembolso
        $reembolsoEstado = null;
        if ($totalReembolsado > 0) {
            if ($totalReembolsado >= $precioTotal && $precioTotal > 0) {
                // Reembolso completo: dejar 'estado' como 'completado' (pagado originalmente) y marcar reembolso_estado
                $nuevoEstadoPago = 'completado';
                $reembolsoEstado = 'completo';
            } else {
                // Reembolso parcial: mantener 'completado' y usar la columna reembolso_estado para detallar
                $nuevoEstadoPago = 'completado';
                $reembolsoEstado = 'parcial_procesado';
            }
        } else {
            // Sin reembolsos, no tocar reembolso_estado y estado pasa a 'pagado' si procede
            $nuevoEstadoPago = $pago->estado ?: 'pagado';
        }

        $updates = ['estado' => $nuevoEstadoPago];
        if ($reembolsoEstado !== null) {
            $updates['reembolso_estado'] = $reembolsoEstado;
        }

        // Solo actualizar si hay cambios (evita write innecesario)
        $shouldUpdate = false;
        foreach ($updates as $k => $v) {
            if ($pago->{$k} !== $v) {
                $shouldUpdate = true;
                break;
            }
        }

        if ($shouldUpdate) {
            $pago->update($updates);
        }
    }

    /**
     * Calcula el monto que puede ser reembolsado en una reserva
     *
     * @param Reserva $reserva
     * @return float Monto reembolsable en euros
     */
    public function calcularMontoReembolsable(Reserva $reserva): float
    {
        $precioTotal = (float)($reserva->precio_total ?? 0);
        $totalReembolsado = (float)(($reserva->reembolsos()->sum('amount_cents') ?? 0) / 100);

        return max(0, $precioTotal - $totalReembolsado);
    }

    /**
     * Obtiene información detallada de reembolsos de una reserva
     *
     * @param Reserva $reserva
     * @return array
     */
    public function obtenerDetallesReembolsos(Reserva $reserva): array
    {
        $reserva->load(['reembolsos', 'refundRequests', 'pagos']);

        $precioTotal = (float)($reserva->precio_total ?? 0);
        $totalReembolsado = (float)(($reserva->reembolsos()->sum('amount_cents') ?? 0) / 100);
        $reembolsableRestante = $this->calcularMontoReembolsable($reserva);

        $refundRequests = $reserva->refundRequests()
            ->with('user')
            ->get()
            ->map(function ($rr) {
                return [
                    'id' => $rr->id,
                    'estado' => $rr->status,
                    'motivo' => $rr->reason_code,
                    'monto_solicitado' => $rr->requested_amount_cents ? ($rr->requested_amount_cents / 100) : null,
                    'monto_procesado' => $rr->processed_refund_amount_cents ? ($rr->processed_refund_amount_cents / 100) : null,
                    'usuario' => $rr->user?->name,
                    'fecha_solicitud' => $rr->created_at?->format('Y-m-d H:i:s'),
                    'fecha_procesado' => $rr->processed_at?->format('Y-m-d H:i:s'),
                ];
            });

        $reembolsos = $reserva->reembolsos()
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'monto' => $r->amount_cents ? ($r->amount_cents / 100) : 0,
                    'tipo' => $r->refund_type ?? 'parcial',
                    'estado' => $r->status,
                    'stripe_id' => $r->stripe_refund_id,
                    'fecha' => $r->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        return [
            'precio_total' => $precioTotal,
            'total_reembolsado' => $totalReembolsado,
            'reembolsable_restante' => $reembolsableRestante,
            'porcentaje_reembolsado' => $precioTotal > 0 ? round(($totalReembolsado / $precioTotal) * 100, 2) : 0,
            'solicitudes' => $refundRequests,
            'reembolsos_procesados' => $reembolsos,
        ];
    }

    /**
     * Determina el tipo de reembolso (parcial o completo)
     *
     * @param float $montoReembolso
     * @param float $precioTotal
     * @return string 'parcial' o 'completo'
     */
    public function determinarTipoReembolso(float $montoReembolso, float $precioTotal): string
    {
        if ($precioTotal <= 0) {
            return 'parcial';
        }

        $porcentaje = ($montoReembolso / $precioTotal) * 100;

        // Si cubre más del 95% considerarlo completo
        return $porcentaje >= 95 ? 'completo' : 'parcial';
    }
}
