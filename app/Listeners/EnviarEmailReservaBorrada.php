<?php

namespace App\Listeners;

use App\Events\ReservaBorrada;
use App\Mail\ReservaCancelada;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;
use App\Notifications\ReservaCanceladaNotification;

class EnviarEmailReservaBorrada implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(ReservaBorrada $event)
    {
        $reserva = $event->reserva;
        try {
            $reserva->loadMissing(['reservable']);
            $destino = $reserva->reservable?->email ?? null;
            if ($reserva->reservable && method_exists($reserva->reservable, 'notify')) {
                $reserva->reservable->notify(new ReservaCanceladaNotification($reserva));
            } elseif ($destino) {
                Notification::route('mail', $destino)->notify(new ReservaCanceladaNotification($reserva));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnviarEmailReservaBorrada failed: ' . $e->getMessage());
        }
    }
}
