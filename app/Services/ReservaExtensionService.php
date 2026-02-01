<?php

namespace App\Services;

use App\Events\ReservaActualizada;
use App\Exceptions\ReservaNotFoundException;
use App\Exceptions\ReservaExtensionException;
use App\Exceptions\ReservaInvalidStatusException;
use App\Models\Reserva;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Servicio especializado en extensión de reservas
 * Maneja toda la lógica relacionada con extender la duración de una reserva
 *
 * Responsabilidades:
 * - Verificar elegibilidad de extensión
 * - Calcular precios de extensión
 * - Aplicar extensiones
 * - Procesar extensiones completas
 */
class ReservaExtensionService
{
    private ReservaDisponibilidadService $disponibilidadService;
    private PrecioService $servicioPrecio;

    public function __construct(
        ?ReservaDisponibilidadService $disponibilidadService = null,
        ?PrecioService $servicioPrecio = null
    ) {
        $this->disponibilidadService = $disponibilidadService ?? new ReservaDisponibilidadService();
        $this->servicioPrecio = $servicioPrecio ?? new PrecioService();
    }

    /**
     * Obtiene información sobre la posibilidad de extender una reserva
     * Verifica tiempo hasta checkout y estado de la reserva
     * Usado por: interfaces de extensión de reserva
     * Retorna: array con información de extensión disponible
     */
    public function obtenerInfoExtension(Reserva $reserva): array
    {
        $checkOut = Carbon::parse($reserva->check_out);
        $horasHastaCheckout = now()->diffInHours($checkOut, false);
        $puedeExtender = $horasHastaCheckout < 24 && $reserva->status !== 'cancelada';

        $razon = null;
        if (!$puedeExtender) {
            if ($reserva->status === 'cancelada') {
                $razon = 'No se pueden extender reservas canceladas';
            } else {
                $razon = 'Solo puedes extender 24 horas antes del checkout';
            }
        }

        return [
            'puede_extender' => $puedeExtender,
            'horas_hasta_checkout' => max(0, (int)$horasHastaCheckout),
            'max_dias' => 3,
            'razon' => $razon,
            'check_out_actual' => $checkOut->format('Y-m-d'),
        ];
    }

    /**
     * Verifica disponibilidad de habitaciones para extensión de reserva
     * Comprueba que las habitaciones asignadas estén libres en el período de extensión
     * Usado por: procesos de extensión de reserva
     * Retorna: array con números de habitaciones no disponibles
     */
    public function verificarDisponibilidadExtension(Reserva $reserva, Carbon $checkOutActual, Carbon $nuevoCheckOut): array
    {
        return $this->disponibilidadService->verificarDisponibilidadExtension($reserva, $checkOutActual, $nuevoCheckOut);
    }

    /**
     * Calcula el precio de extensión de una reserva
     * Suma precios de todas las habitaciones por el período de extensión
     * Usado por: procesos de extensión de reserva
     * Retorna: precio total de la extensión (float)
     */
    public function calcularPrecioExtension(Reserva $reserva, Carbon $checkOutActual, Carbon $nuevoCheckOut): float
    {
        $precioExtension = 0;

        foreach ($reserva->habitaciones as $habitacionReserva) {
            $habitacion = $habitacionReserva->habitacion;
            $precioExtension += $this->servicioPrecio->precioEntreFechas(
                $habitacion->tipo,
                $checkOutActual,
                $nuevoCheckOut
            );
        }

        return $precioExtension;
    }

    /**
     * Aplica la extensión a una reserva
     * Actualiza fechas de checkout y recalcula precio total
     * Usado por: acciones de extensión de reserva
     * Retorna: void
     */
    public function aplicarExtension(Reserva $reserva, Carbon $nuevoCheckOut, float $precioExtension): void
    {
        $reserva->check_out = $nuevoCheckOut;
        $reserva->precio_total += $precioExtension;
        $reserva->save();

        // Actualizar las fechas en las relaciones HabitacionReserva
        foreach ($reserva->habitaciones as $habitacionReserva) {
            $habitacionReserva->check_out = $nuevoCheckOut;
            $habitacionReserva->save();
        }
    }

    /**
     * Extiende una reserva: valida, calcula precio y aplica si se confirma
     * Verifica disponibilidad, calcula precio y aplica extensión si se confirma
     * Usado por: acciones de extensión de reserva desde panel de control
     * Retorna: array con resultado de la extensión
     */
    public function extenderReserva(string $localizador, int $numeroDias, bool $confirmar = false): array
    {
        $reserva = Reserva::with(['habitaciones.habitacion', 'pagos'])->where('localizador', $localizador)->first();
        if (!$reserva) {
            throw new ReservaNotFoundException($localizador);
        }

        $checkOut = Carbon::parse($reserva->check_out);
        $horas = now()->diffInHours($checkOut);

        if ($horas >= 24) {
            throw new ReservaExtensionException('Solo está disponible 24 horas antes del checkout');
        }

        if ($reserva->status === 'cancelada') {
            throw new ReservaInvalidStatusException('cancelada');
        }

        if ($numeroDias < 1 || $numeroDias > 3) {
            throw new ReservaExtensionException('Debes seleccionar entre 1 y 3 días de extensión');
        }

        $nuevoCheckOut = $checkOut->copy()->addDays($numeroDias);

        // Verificar disponibilidad
        $habitacionesNoDisponibles = $this->verificarDisponibilidadExtension($reserva, $checkOut, $nuevoCheckOut);
        if (!empty($habitacionesNoDisponibles)) {
            return [
                'success' => false,
                'error' => 'Las habitaciones no están disponibles para la extensión seleccionada',
                'habitaciones_no_disponibles' => $habitacionesNoDisponibles
            ];
        }

        $precioExtension = $this->calcularPrecioExtension($reserva, $checkOut, $nuevoCheckOut);
        $necesitaPago = $reserva->pago === 'pagado';

        if ($confirmar) {
            $this->aplicarExtension($reserva, $nuevoCheckOut, $precioExtension);
            try {
                event(new ReservaActualizada($reserva, null));
            } catch (\Throwable $e) {
                Log::error('Error disparando evento ReservaActualizada en extensión: ' . $e->getMessage());
            }
            return [
                'success' => true,
                'aplicada' => true,
                'nuevo_check_out' => $nuevoCheckOut->toDateString(),
                'precio_extension' => $precioExtension,
                'necesita_pago' => $necesitaPago
            ];
        }

        return [
            'success' => true,
            'aplicada' => false,
            'nuevo_check_out' => $nuevoCheckOut->toDateString(),
            'precio_extension' => $precioExtension,
            'necesita_pago' => $necesitaPago
        ];
    }
}
