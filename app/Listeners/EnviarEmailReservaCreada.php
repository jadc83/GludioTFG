<?php

namespace App\Listeners;

use App\Events\ReservaCreada;
use App\Mail\ReservaCompletada;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;
use App\Notifications\ReservaCreadaNotification;

class EnviarEmailReservaCreada implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(ReservaCreada $event)
    {
        $reserva = $event->reserva;
        try {
            $reserva->loadMissing(['reservable']);
            $destino = $reserva->reservable?->email ?? null;
            // Evitar envíos duplicados comprobando la tabla notifications (Postgres JSON cast)
            try {
                $already = \Illuminate\Support\Facades\DB::table('notifications')
                    ->where('type', '\\App\\Notifications\\ReservaCreadaNotification')
                    ->whereRaw("(data->>'reserva_id')::int = ?", [$reserva->id])
                    ->exists();
            } catch (\Throwable $e) {
                $already = false;
            }

            if (! $already) {
                if ($reserva->reservable && method_exists($reserva->reservable, 'notify')) {
                    $reserva->reservable->notify(new ReservaCreadaNotification($reserva));
                } elseif ($destino) {
                    Notification::route('mail', $destino)->notify(new ReservaCreadaNotification($reserva));
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnviarEmailReservaCreada failed: ' . $e->getMessage());
        }
    }
}
