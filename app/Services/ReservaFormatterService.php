<?php

namespace App\Services;

use App\Models\Habitacion;
use App\Models\Reserva;
use Carbon\Carbon;

/**
 * Servicio especializado en formateo de datos de reservas
 * Transforma modelos de BD en arrays listos para enviar a frontend
 *
 * Responsabilidades:
 * - Formatear colecciones de reservas
 * - Preparar datos para vistas de edición
 * - Formatear información de clientes
 * - Formatear reembolsos con tipos
 * - Preparar opciones de habitaciones disponibles
 */
class ReservaFormatterService
{
    private PrecioService $servicioPrecio;

    public function __construct(?PrecioService $servicioPrecio = null)
    {
        $this->servicioPrecio = $servicioPrecio ?? new PrecioService();
    }

    /**
     * Formatea una colección de reservas para respuesta API
     * Incluye cliente, habitaciones, precios y estadísticas
     * Usado por: controladores de listado de reservas
     * Retorna: array formateado de reservas
     */
    public function formatearReservas($reservas): array
    {
        return $reservas->map(function ($reserva) {
            $nombreCliente = 'Sin cliente';
            if ($reserva->reservable) {
                $nombreCliente = $reserva->reservable?->name ?? 'Sin cliente';
            }

            $reembolsosTotal = $reserva->reembolsos ? ($reserva->reembolsos->sum('amount_cents') ?: 0) / 100 : 0;

            return [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => $reembolsosTotal,
                'notas' => $reserva->notas,
                'created_at' => $reserva->created_at ? $reserva->created_at->toIso8601String() : null,
                'cliente_name' => $nombreCliente,
                'booked_by_user' => $reserva->bookedBy->name ?? 'Sistema',
                'habitacion_numero' => (function() use ($reserva) {
                    $nums = $reserva->habitaciones->map(function($hr) { return $hr->habitacion?->numero ?? null; })->filter()->values();
                    return $nums->count() ? $nums->implode(', ') : 's/a';
                })(),
            ];
        })->toArray();
    }

    /**
     * Formatea datos de reserva para interfaz de edición
     * Sobrecargado: puede recibir (Reserva) o (Reserva, Carbon, Carbon)
     * Incluye habitaciones, precios y estadísticas
     * Usado por: controladores de edición de reserva
     * Retorna: array con todos los datos formateados para edición
     */
    public function formatearReservaParaEdicion(Reserva $reserva, ?Carbon $checkIn = null, ?Carbon $checkOut = null): array
    {
        // Si no se proporcionan fechas, usarlas de la reserva
        if (!$checkIn) {
            $checkIn = Carbon::parse($reserva->check_in);
        }
        if (!$checkOut) {
            $checkOut = Carbon::parse($reserva->check_out);
        }

        $noches = max(1, $checkIn->diffInDays($checkOut));

        $reservaData = [
            'id' => $reserva->id,
            'localizador' => $reserva->localizador,
            'check_in' => Carbon::parse($reserva->check_in)->format('Y-m-d'),
            'check_out' => Carbon::parse($reserva->check_out)->format('Y-m-d'),
            'precio_total' => $reserva->precio_total,
            'status' => $reserva->status,
            'pago' => $reserva->pago,
            'notas' => $reserva->notas,
            'cliente' => [
                'id' => $reserva->reservable?->id ?? null,
                'name' => $reserva->reservable?->name ?? 'N/A',
                'email' => $reserva->reservable?->email ?? null,
                'telefono' => $reserva->reservable?->telefono ?? null,
                'numero_documento' => $reserva->reservable?->numero_documento ?? null,
                'tipo_documento' => $reserva->reservable?->tipo_documento ?? null,
            ],
            'habitaciones' => $reserva->habitaciones->map(function ($hr) use ($noches) {
                return [
                    'habitacion_id' => $hr->habitacion?->id ?? $hr->id,
                    'id' => $hr->habitacion?->id ?? $hr->id,
                    'numero' => $hr->habitacion?->numero ?? null,
                    'tipo' => $hr->tipo ?? $hr->habitacion?->tipo ?? null,
                    'precio_noche' => $hr->precio ? round($hr->precio / max(1, $noches), 2) : null,
                    'capacidad' => $hr->habitacion?->capacidad ?? null,
                    'precio' => $hr->precio,
                ];
            })->values(),
        ];

        return $reservaData;
    }

    /**
     * Formatea información del cliente de una reserva
     * Determina si es usuario registrado o cliente invitado
     * Usado por: formatearReservas(), detalles de reserva
     * Retorna: array con tipo y nombre del cliente
     */
    public function formatearCliente($reserva): array
    {
        if ($reserva->reservable_type === 'App\\Models\\User') {
            return [
                'tipo' => 'usuario',
                'nombre' => $reserva->reservable?->name ?? 'Usuario no disponible',
            ];
        }
        return [
            'tipo' => 'cliente',
            'nombre' => $reserva->reservable?->name ?? 'Cliente no disponible',
        ];
    }

    /**
     * Formatea lista de reembolsos con tipos (parcial/completo)
     * Calcula los tipos según el monto acumulado vs total de la reserva
     * Usado por: controlador show(), detalles de reserva
     * Retorna: array de reembolsos formateados
     */
    public function formatearReembolsos(Reserva $reserva): array
    {
        $reservaTotal = $reserva->precio_total ?? 0;
        $cumulative = 0;

        return $reserva->reembolsos->sortBy('created_at')->values()->map(function ($r) use ($reservaTotal, &$cumulative) {
            $amount = ($r->amount_cents ?? 0) / 100;
            $cumulative += $amount;

            // Determinar si es reembolso parcial o completo
            $tipo = 'parcial';
            if ($reservaTotal > 0 && $cumulative >= $reservaTotal) {
                $tipo = 'completo';
            }

            return [
                'id' => $r->id,
                'monto' => round($amount, 2),
                'status' => $r->status,
                'reason' => $r->reason ?? null,
                'created_at' => $r->created_at?->format('Y-m-d H:i:s') ?? null,
                'tipo' => $tipo,
            ];
        })->values()->toArray();
    }

    /**
     * Obtiene las habitaciones disponibles y calcula precios para la vista de edición
     * Devuelve una colección mapeada lista para enviar a la vista.
     * Usado por: formatearReservaParaEdicion()
     * Retorna: colección de habitaciones con precios calculados
     */
    public function obtenerHabitacionesYPreciosParaEdicion(Reserva $reserva, Carbon $checkIn, Carbon $checkOut)
    {
        // Aceptar también strings por seguridad: coerción a Carbon
        if (!($checkIn instanceof Carbon)) {
            $checkIn = Carbon::parse($checkIn);
        }
        if (!($checkOut instanceof Carbon)) {
            $checkOut = Carbon::parse($checkOut);
        }

        $habitacionesActualesIds = $reserva->habitaciones->pluck('habitacion.id')->filter()->values()->toArray();

        $checkInStr = $checkIn->toDateString();
        $checkOutStr = $checkOut->toDateString();

        // Obtener TODAS las habitaciones disponibles en las fechas seleccionadas
        $habitaciones = Habitacion::select('id', 'numero', 'tipo', 'capacidad', 'estado')
            ->where('estado', 'disponible')
            ->whereDoesntHave('reservas', function ($subQ) use ($reserva, $checkInStr, $checkOutStr) {
                $subQ->where('reserva_id', '!=', $reserva->id)
                    ->where('check_in', '<', $checkOutStr)
                    ->where('check_out', '>', $checkInStr);
            })
            ->whereNotIn('id', $habitacionesActualesIds) // Excluir habitaciones ya asignadas a esta reserva
            ->orderBy('numero')
            ->get();

        $noches = max(1, $checkIn->diffInDays($checkOut));

        return $habitaciones->map(function ($hab) use ($checkIn, $checkOut, $noches) {
            $precioDinamico = $this->servicioPrecio->precioEntreFechas($hab->tipo, $checkIn, $checkOut);

            return [
                'id' => $hab->id,
                'numero' => $hab->numero,
                'tipo' => $hab->tipo,
                'precio_noche' => round($precioDinamico / $noches, 2),
                'precio_total' => $precioDinamico,
                'capacidad' => $hab->capacidad,
                'estado' => $hab->estado,
            ];
        });
    }
}
