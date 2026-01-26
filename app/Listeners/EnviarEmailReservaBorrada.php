<?php

namespace App\Listeners;

use App\Events\ReservaBorrada;
use App\Mail\ReservaCancelada;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class EnviarEmailReservaBorrada implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(ReservaBorrada $event)
    {
        $reserva = $event->reserva;
        try {
            $reserva->loadMissing(['reservable']);
            $destino = $reserva->reservable?->email ?? null;
            if ($destino) {
                Mail::to($destino)->send(new ReservaCancelada($reserva));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnviarEmailReservaBorrada failed: ' . $e->getMessage());
        }
    }
}
