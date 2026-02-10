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
    /**
     * @param \Illuminate\Support\Collection<int, \App\Models\Reserva> $reservas
     * @return array<int, array<string,mixed>>
     */
    public function formatearReservas(\Illuminate\Support\Collection $reservas): array
    {
        return $reservas->map(function (\App\Models\Reserva $reserva): array {
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
                'descuento_aplicado' => $reserva->descuento_aplicado,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => $reembolsosTotal,
                'notas' => $reserva->notas,
                'created_at' => $reserva->created_at ? $reserva->created_at->toIso8601String() : null,
                'cliente_name' => $nombreCliente,
                'booked_by_user' => $reserva->bookedBy->name ?? 'Sistema',
                'habitacion_numero' => (function() use ($reserva) {
                    $nums = $reserva->habitaciones->map(function(\App\Models\HabitacionReserva $hr) { return $hr->habitacion?->numero ?? null; })->filter()->values();
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
    /**
     * @param \App\Models\Reserva $reserva
     * @param \Carbon\Carbon|null $checkIn
     * @param \Carbon\Carbon|null $checkOut
     * @return array<string, mixed>
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

        // Recalcular desglose por tipo para asegurar consistencia entre
        // suma de habitaciones y `precio_total` mostrado
        $tiposCount = [];
        foreach ($reserva->habitaciones as $hr) {
            $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? 'unknown';
            $tiposCount[$tipo] = ($tiposCount[$tipo] ?? 0) + 1;
        }

        $habitacionesParaPrecio = [];
        foreach ($tiposCount as $tipo => $cantidad) {
            $habitacionesParaPrecio[] = ['tipo' => $tipo, 'cantidad' => $cantidad];
        }

        $precioDetalle = $this->servicioPrecio->precioConTarifas($habitacionesParaPrecio, $checkIn, $checkOut, []);

        $precioPorTipo = [];
        if (isset($precioDetalle['habitaciones']) && is_array($precioDetalle['habitaciones'])) {
            foreach ($precioDetalle['habitaciones'] as $h) {
                $precioPorTipo[$h['tipo']] = $h['precioTotal'] ?? ($h['precioAvg'] ?? 0);
            }
        }

        $reservaData = [
            'id' => $reserva->id,
            'localizador' => $reserva->localizador,
            'check_in' => Carbon::parse($reserva->check_in)->format('Y-m-d'),
            'check_out' => Carbon::parse($reserva->check_out)->format('Y-m-d'),
            'check_in_full' => Carbon::parse($reserva->check_in)->toIso8601String(),
            'check_out_full' => Carbon::parse($reserva->check_out)->toIso8601String(),
            'check_in_time' => Carbon::parse($reserva->check_in)->format('H:i'),
            'check_out_time' => Carbon::parse($reserva->check_out)->format('H:i'),
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
                'direccion' => $reserva->reservable?->direccion ?? null,
            ],
            'booked_by_user' => [
                'id' => $reserva->bookedBy?->id ?? null,
                'name' => $reserva->bookedBy?->name ?? ($reserva->booked_by_user ?? 'Sistema'),
                'email' => $reserva->bookedBy?->email ?? null,
            ],
            'habitaciones' => $reserva->habitaciones->map(function (\App\Models\HabitacionReserva $hr) use ($noches, $precioPorTipo, $tiposCount): array {
                $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
                $precioTotalTipo = $tipo && isset($precioPorTipo[$tipo]) ? $precioPorTipo[$tipo] : null;
                $cantidadTipo = $tipo && isset($tiposCount[$tipo]) ? $tiposCount[$tipo] : 1;

                $precioAsignado = $precioTotalTipo !== null ? round($precioTotalTipo / max(1, $cantidadTipo), 2) : $hr->precio;

                return [
                    'habitacion_id' => $hr->habitacion_id,
                    'slot_id' => $hr->id,
                    'numero' => $hr->habitacion?->numero ?? null,
                    'tipo' => $tipo,
                    'precio_noche' => $precioAsignado ? round($precioAsignado / max(1, $noches), 2) : null,
                    'capacidad' => $hr->habitacion?->capacidad ?? null,
                    'precio' => $precioAsignado,
                ];
            })->values(),
        ];

        // Incluir información de tarifa si está presente.
        // Preferir la relación `tarifa` (columna tarifa_id). Si no existe, intentar usar la primera tarifa
        // asociada en la tabla pivot `reserva_tarifas` (relación `tarifas`).
        if ($reserva->tarifa) {
            $tar = $reserva->tarifa;
        } else {
            $tar = null;
            try {
                $first = $reserva->tarifas?->first() ?? null;
                if ($first) $tar = $first;
            } catch (\Throwable $__e) {
                $tar = null;
            }
        }

        if ($tar) {
            $reservaData['tarifa'] = [
                'id' => $tar->id ?? null,
                // Tarifa model uses Spanish field names
                'name' => $tar->nombre ?? ($tar->name ?? ($tar->descripcion ?? null)),
                'price' => $tar->modificador_precio ?? ($tar->price ?? null),
            ];
        } else {
            $reservaData['tarifa'] = null;
        }

        // Export all tarifas associated to the reserva (pivot `reserva_tarifas`), mapping Spanish fields
        try {
            $tarifasCollection = $reserva->tarifas ?? collect();
            $reservaData['tarifas'] = $tarifasCollection->map(function ($t) {
                return [
                    'id' => $t->id ?? null,
                    'name' => $t->nombre ?? ($t->name ?? ($t->descripcion ?? null)),
                    'price' => $t->modificador_precio ?? ($t->price ?? null),
                ];
            })->values()->toArray();
        } catch (\Throwable $__e) {
            $reservaData['tarifas'] = [];
        }

        // Incluir solicitudes de reembolso (RefundRequest) para que el frontend pueda
        // mostrar si hay una solicitud pendiente y deshabilitar el botón.
        try {
            $refundRequestsCollection = $reserva->refundRequests ?? collect();
            $reservaData['refundRequests'] = $refundRequestsCollection->map(function ($rr) {
                return [
                    'id' => $rr->id ?? null,
                    'status' => $rr->status ?? null,
                    'requested_amount' => isset($rr->requested_amount_cents) ? round($rr->requested_amount_cents / 100, 2) : null,
                    'created_at' => $rr->created_at?->toIso8601String() ?? null,
                    'pending_check_in' => $rr->pending_check_in ?? null,
                    'pending_check_out' => $rr->pending_check_out ?? null,
                ];
            })->values()->toArray();
        } catch (\Throwable $__e) {
            $reservaData['refundRequests'] = [];
        }

        return $reservaData;
    }

    /**
     * Formatea información del cliente de una reserva
     * Determina si es usuario registrado o cliente invitado
     * Usado por: formatearReservas(), detalles de reserva
     * Retorna: array con tipo y nombre del cliente
     */
    public function formatearCliente(Reserva $reserva): array
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
    /**
     * @param \App\Models\Reserva $reserva
     * @return array<int, array<string, mixed>>
     */
    public function formatearReembolsos(Reserva $reserva): array
    {
        $reservaTotal = $reserva->precio_total ?? 0;
        $cumulative = 0;

        return $reserva->reembolsos->sortBy('created_at')->values()->map(function (\App\Models\Refund $r) use ($reservaTotal, &$cumulative): array {
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
    /**
     * @param \App\Models\Reserva $reserva
     * @param \Carbon\Carbon $checkIn
     * @param \Carbon\Carbon $checkOut
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    public function obtenerHabitacionesYPreciosParaEdicion(Reserva $reserva, Carbon $checkIn, Carbon $checkOut): \Illuminate\Support\Collection
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

        // Obtener TODAS las habitaciones disponibles en las fechas seleccionadas, incluyendo las ya asignadas para permitir reasignación
        $habitaciones = Habitacion::select('id', 'numero', 'tipo', 'capacidad', 'estado')
            ->where('estado', 'disponible')
            ->whereDoesntHave('reservas', function ($subQ) use ($reserva, $checkInStr, $checkOutStr) {
                $subQ->where('reserva_id', '!=', $reserva->id)
                    ->where('check_in', '<', $checkOutStr)
                    ->where('check_out', '>', $checkInStr);
            })
            // No excluir habitaciones ya asignadas a esta reserva
            ->orderBy('numero')
            ->get();

        $noches = max(1, $checkIn->diffInDays($checkOut));

        return $habitaciones->map(function (\App\Models\Habitacion $hab) use ($checkIn, $checkOut, $noches): array {
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
