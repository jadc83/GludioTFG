<?php

namespace App\Listeners;

use App\Events\ReservaCreada;
use App\Mail\ReservaCompletada;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class EnviarEmailReservaCreada implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(ReservaCreada $event)
    {
        $reserva = $event->reserva;
        try {
            $reserva->loadMissing(['reservable']);
            $destino = $reserva->reservable?->email ?? null;
            if ($destino) {
                Mail::to($destino)->send(new ReservaCompletada($reserva));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnviarEmailReservaCreada failed: ' . $e->getMessage());
        }
    }
}
