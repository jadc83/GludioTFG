<?php

namespace App\Services;

use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Exceptions\NoDisponibilidadException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Servicio especializado en verificación de disponibilidad de habitaciones
 * Maneja toda la lógica de comprobación de disponibilidad para reservas
 *
 * Responsabilidades:
 * - Verificar disponibilidad múltiple
 * - Contar habitaciones disponibles por tipo
 * - Verificar habitaciones específicas
 * - Extensiones de reserva
 */
class ReservaDisponibilidadService
{


    /**
     * Verifica disponibilidad de múltiples tipos de habitaciones
     * Itera sobre cada tipo de habitación requerido y verifica disponibilidad
     * Usado por: crearReserva(), actualizarReserva()
     * Retorna: true si todas están disponibles, lanza excepción si no
     */
    public function verificarDisponibilidadMultiple(array $habitacionesRequeridas, Carbon $checkIn, Carbon $checkOut): bool
    {
        foreach ($habitacionesRequeridas as $habitacion) {
            $tipo = $habitacion['tipo'] ?? null;
            $cantidad = $habitacion['cantidad'] ?? 0;

            if ($cantidad <= 0) continue;

            $this->verificarDisponibilidad($tipo, $checkIn, $checkOut, $cantidad);
        }

        return true;
    }

    /**
     * Cuenta cuántas habitaciones de un tipo están disponibles (tiene en cuenta placeholders)
     * Usa HabitacionService para cálculo preciso considerando reservas existentes y placeholders
     * Usado por: verificarDisponibilidad()
     * Retorna: número entero de habitaciones disponibles
     */
    private function contarHabitacionesDisponibles(string $tipo, Carbon $checkIn, Carbon $checkOut): int
    {
        $habitacionService = new HabitacionService();
        $resumen = $habitacionService->contarDisponiblesPorTipo($checkIn, $checkOut, true);

        $cantidad = $resumen[$tipo]['cantidad'] ?? 0;
        try {
            Log::debug('Disponibilidad debug', [
                'tipo' => $tipo,
                'check_in' => $checkIn->toDateString(),
                'check_out' => $checkOut->toDateString(),
                'resumen' => $resumen,
                'cantidad' => $cantidad,
            ]);
        } catch (\Throwable $e) {
            // no bloquear por logging
        }

        return $cantidad;
    }

    /**
     * Ejecuta una transacción con lock sobre habitaciones de un tipo y verifica disponibilidad.
     * Si se proporciona $cb (callable), se ejecuta dentro de la transacción después de la comprobación.
     */
    private function verificarDisponibilidad(string $tipo, Carbon $checkIn, Carbon $checkOut, int $cantidad, ?callable $cb = null): void
    {
        DB::transaction(function () use ($tipo, $checkIn, $checkOut, $cantidad, $cb) {
            Habitacion::where('tipo', $tipo)->lockForUpdate()->get();

            $disponibles = $this->contarHabitacionesDisponibles($tipo, $checkIn, $checkOut);

            if ($disponibles < $cantidad) {
                try {
                    Log::error('Verificación de disponibilidad fallida', [
                        'tipo' => $tipo,
                        'requiere' => $cantidad,
                        'disponibles' => $disponibles,
                        'check_in' => $checkIn->toDateString(),
                        'check_out' => $checkOut->toDateString(),
                    ]);
                } catch (\Throwable $e) {
                    // ignore logging error
                }
                throw new NoDisponibilidadException($tipo, $cantidad);
            }

            if (is_callable($cb)) {
                $cb();
            }
        });
    }

    /**
     * Verifica si una habitación específica está disponible en un rango de fechas
     * Excluye una reserva específica si se proporciona (para modificaciones)
     * Usado por: modificaciones de reserva, extensiones
     * Retorna: boolean indicando disponibilidad
     */
    public function verificarDisponibilidadHabitacion(int $habitacionId, Carbon $checkIn, Carbon $checkOut, ?int $excluirReservaId = null): bool
    {
        $query = HabitacionReserva::where('habitacion_id', $habitacionId)
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn);

        if ($excluirReservaId) {
            $query->where('reserva_id', '!=', $excluirReservaId);
        }

        return !$query->exists();
    }

    /**
     * Verifica disponibilidad de habitaciones para extensión de reserva
     * Comprueba que las habitaciones asignadas estén libres en el período de extensión
     * Usado por: procesos de extensión de reserva
     * Retorna: array con números de habitaciones no disponibles
     */
    // Método verificarDisponibilidadExtension eliminado: extensiones de reserva retiradas.
}
