<?php

namespace App\Actions\Reservas;

use App\Services\PrecioService;
use Carbon\Carbon;

class CalcularPrecioAction
{
    protected PrecioService $precioService;

    public function __construct(PrecioService $precioService)
    {
        $this->precioService = $precioService;
    }

    /**
     * $data expects: ['check_in','check_out','habitaciones', 'tarifas'(optional), 'reserva_id'(optional)]
     */
    public function handle(array $data): array
    {
        $checkIn = Carbon::createFromFormat('Y-m-d', $data['check_in']);
        $checkOut = Carbon::createFromFormat('Y-m-d', $data['check_out']);

        $tarifas = is_array($data['tarifas'] ?? []) ? $data['tarifas'] : [];

        // Mapear habitaciones a formato esperado: array de ['tipo' => string, 'cantidad' => int]
        // Aceptamos entradas con { tipo, cantidad } o una lista de entradas individuales.
        $habitacionesMapeadas = [];
        $tiposCount = [];
        foreach ($data['habitaciones'] as $hab) {
            $tipo = $hab['tipo'] ?? $hab['tipo_habitacion'] ?? null;
            if (!$tipo) continue;

            // Si se envía 'cantidad', respetarla; si no, asumir 1 por entrada
            if (array_key_exists('cantidad', $hab)) {
                $cantidad = (int) $hab['cantidad'];
                $tiposCount[$tipo] = ($tiposCount[$tipo] ?? 0) + max(0, $cantidad);
            } else {
                $tiposCount[$tipo] = ($tiposCount[$tipo] ?? 0) + 1;
            }
        }

        foreach ($tiposCount as $tipo => $cantidad) {
            $habitacionesMapeadas[] = ['tipo' => $tipo, 'cantidad' => $cantidad];
        }

        $nuevoPrecio = $this->precioService->precioConTarifas($habitacionesMapeadas, $checkIn, $checkOut, $tarifas);

        // Verificar disponibilidad
        $available = $this->verificarDisponibilidad($habitacionesMapeadas, $checkIn, $checkOut, $data['reserva_id'] ?? null);

        $numeroNoches = $checkIn->diffInDays($checkOut);
        $perNight = 0;
        if ($numeroNoches > 0) {
            $perNight = isset($nuevoPrecio['total']) ? round(($nuevoPrecio['total'] / max(1, $numeroNoches)), 2) : 0;
        }

        $resultado = [
            'nuevo_total' => $nuevoPrecio['total'] ?? 0,
            'per_night' => $perNight,
            'available' => $available,
            // incluir desglose por tipo para que el frontend pueda mapear preciosPorTipo
            'habitaciones' => $nuevoPrecio['habitaciones'] ?? [],
        ];

        // Compatibilidad: algunos consumidores esperan 'total' o 'precio_total'
        $resultado['total'] = $resultado['nuevo_total'];
        $resultado['precio_total'] = $resultado['nuevo_total'];

        if (isset($data['reserva_id'])) {
            $reserva = \App\Models\Reserva::find($data['reserva_id']);
            if ($reserva) {
                $viejoTotal = $reserva->precio_total ?? 0;
                $diferencia = $resultado['nuevo_total'] - $viejoTotal;
                $resultado['viejo_total'] = $viejoTotal;
                $resultado['diferencia'] = $diferencia;
                $resultado['estimate_charge'] = max(0, $diferencia);
                $resultado['estimate_refund'] = max(0, -$diferencia);
                $resultado['penalizacion'] = 0; // Simplificado

                $nochesNuevas = $checkIn->diffInDays($checkOut);
                $nochesViejas = Carbon::parse($reserva->check_in)->diffInDays(Carbon::parse($reserva->check_out));
                $extraNights = max(0, $nochesNuevas - $nochesViejas);
                $removedNights = max(0, $nochesViejas - $nochesNuevas);
                $resultado['extra_nights'] = $extraNights;
                $resultado['removed_nights'] = $removedNights;

                // Calcular cambio por noche basándonos en las noches afectadas (no en la media total)
                if ($extraNights > 0) {
                    // precio adicional por las noches nuevas: diferencia dividida entre noches añadidas
                    $resultado['per_night_change'] = $extraNights > 0 ? round(($diferencia / $extraNights), 2) : 0;
                } elseif ($removedNights > 0) {
                    // Calcular el reembolso bruto tomando el precio real de las noches eliminadas
                    try {
                        $oldCheckIn = Carbon::parse($reserva->check_in);
                        $oldCheckOut = Carbon::parse($reserva->check_out);

                        // Determinar rango de noches eliminadas: si el check_out nuevo es menor, las noches eliminadas van de new_check_out..old_check_out
                        if ($checkOut->lt($oldCheckOut)) {
                            $removedStart = $checkOut->copy();
                            $removedEnd = $oldCheckOut->copy();
                        } else {
                            // Si el check_in nuevo es mayor, las noches eliminadas van de old_check_in..new_check_in
                            $removedStart = $oldCheckIn->copy();
                            $removedEnd = $checkIn->copy();
                        }

                        $removedPrecioRes = $this->precioService->precioConTarifas($habitacionesMapeadas, $removedStart, $removedEnd, $tarifas);
                        $rawRefund = isset($removedPrecioRes['total']) ? $removedPrecioRes['total'] : ($viejoTotal - $resultado['nuevo_total']);
                    } catch (\Throwable $_) {
                        $rawRefund = ($viejoTotal - $resultado['nuevo_total']);
                    }

                    $resultado['per_night_change'] = $removedNights > 0 ? round(($rawRefund / $removedNights), 2) : 0;
                } else {
                    $resultado['per_night_change'] = 0;
                }

                // Penalización por defecto no aplicada aquí (frontend la aplica), pero dejamos campo para compatibilidad
                $penalizacion = $resultado['penalizacion'] ?? 0;
                if ($removedNights > 0) {
                    $penalPerNight = $removedNights > 0 ? round(($penalizacion / $removedNights), 2) : 0;
                    $resultado['per_night_net'] = round(max(0, $resultado['per_night_change'] - $penalPerNight), 2);
                } else {
                    $resultado['per_night_net'] = $resultado['per_night_change'];
                }
            }
        }

        // Log para depuración del payload y mapeo usado
        try {
            \Log::info('CalcularPrecioAction payload', [
                'input_habitaciones' => $data['habitaciones'] ?? null,
                'habitaciones_mapeadas' => $habitacionesMapeadas,
                'check_in' => $checkIn->format('Y-m-d'),
                'check_out' => $checkOut->format('Y-m-d'),
                'resultado' => $resultado,
            ]);
        } catch (\Throwable $_) {
            // noop
        }

        return $resultado;
    }

    private function verificarDisponibilidad(array $habitaciones, Carbon $checkIn, Carbon $checkOut, ?int $excluirReservaId = null): bool
    {
        foreach ($habitaciones as $hab) {
            $tipo = $hab['tipo'];
            $habitacionesTipo = \App\Models\Habitacion::where('tipo', $tipo)->where('estado', 'disponible')->get();
            $ids = $habitacionesTipo->pluck('id')->toArray();

            $reservadas = \App\Models\HabitacionReserva::whereIn('habitacion_id', $ids)
                ->where('check_in', '<', $checkOut)
                ->where('check_out', '>', $checkIn);

            if ($excluirReservaId) {
                $reservadas->where('reserva_id', '!=', $excluirReservaId);
            }

            $countReservadas = $reservadas->distinct('habitacion_id')->count('habitacion_id');
            $disponibles = count($ids) - $countReservadas;

            if ($disponibles <= 0) {
                return false;
            }
        }
        return true;
    }
}
