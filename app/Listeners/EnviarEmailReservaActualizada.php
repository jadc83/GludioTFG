<?php

namespace App\Listeners;

use App\Events\ReservaActualizada;
use App\Mail\ReservaActualizada as ReservaActualizadaMail;
use App\Mail\ReservaCancelada;
use Illuminate\Support\Facades\Notification;
use App\Notifications\ReservaActualizadaNotification;
use App\Notifications\ReservaCanceladaNotification;

class EnviarEmailReservaActualizada
{

    public function handle(ReservaActualizada $event)
    {
        $reserva = $event->reserva;
        $meta = $event->meta ?? [];

        try {
            $reserva->loadMissing(['reservable', 'pagos']);
            $destino = $reserva->reservable?->email ?? null;
            if (! $destino) {
                return;
            }

            // Evitar envíos duplicados: comprobar si ya existe notificación de actualización
            try {
                $already = \Illuminate\Support\Facades\DB::table('notifications')
                    ->where('type', '\\App\\Notifications\\ReservaActualizadaNotification')
                    ->whereRaw("(data->>'reserva_id')::int = ?", [$reserva->id])
                    ->exists();
            } catch (\Throwable $e) {
                $already = false;
            }

            if ($already) {
                return;
            }

            if (isset($meta['type']) && $meta['type'] === 'cancelado') {
                $motivo = $meta['motivo'] ?? null;
                if ($reserva->reservable && method_exists($reserva->reservable, 'notify')) {
                    $reserva->reservable->notify(new ReservaCanceladaNotification($reserva, $motivo));
                } elseif ($destino) {
                    Notification::route('mail', $destino)->notify(new ReservaCanceladaNotification($reserva, $motivo));
                }
                return;
            }

            // Default: enviar mail de reserva actualizada
            if ($reserva->reservable && method_exists($reserva->reservable, 'notify')) {
                $reserva->reservable->notify(new ReservaActualizadaNotification($reserva, $meta['comprobante_path'] ?? null));
            } elseif ($destino) {
                Notification::route('mail', $destino)->notify(new ReservaActualizadaNotification($reserva, $meta['comprobante_path'] ?? null));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnviarEmailReservaActualizada failed: ' . $e->getMessage());
        }
    }
}
