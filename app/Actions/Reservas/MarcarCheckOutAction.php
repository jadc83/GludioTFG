<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MarcarCheckOutAction
{
    public function handle(string $localizador): array
    {
        $reserva = Reserva::where('localizador', $localizador)->firstOrFail();

        $now = Carbon::now();
        $checkOut = Carbon::parse($reserva->check_out);

        if ($now->startOfDay()->gt($checkOut->endOfDay())) {
            return [ 'success' => false, 'error' => 'No se puede hacer check-out: la fecha de salida ya ha pasado.' ];
        }

        if ($reserva->status !== 'checked_in') {
            return [ 'success' => false, 'error' => 'La reserva no está marcada como check-in.' ];
        }

        $reserva->status = 'checked_out';
        $reserva->save();

        try { event(new \App\Events\ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

        return [ 'success' => true, 'message' => 'Check-out realizado', 'reserva' => [ 'localizador' => $reserva->localizador, 'status' => $reserva->status ] ];
    }
}
