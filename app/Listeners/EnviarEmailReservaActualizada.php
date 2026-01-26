<?php

namespace App\Listeners;

use App\Events\ReservaActualizada;
use App\Mail\ReservaActualizada as ReservaActualizadaMail;
use App\Mail\ReservaCancelada;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class EnviarEmailReservaActualizada implements ShouldQueue
{
    use InteractsWithQueue;

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

            if (isset($meta['type']) && $meta['type'] === 'cancelado') {
                $motivo = $meta['motivo'] ?? null;
                Mail::to($destino)->send(new ReservaCancelada($reserva, $motivo));
                return;
            }

            // Default: enviar mail de reserva actualizada
            Mail::to($destino)->send(new ReservaActualizadaMail($reserva, $meta['comprobante_path'] ?? null));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnviarEmailReservaActualizada failed: ' . $e->getMessage());
        }
    }
}
