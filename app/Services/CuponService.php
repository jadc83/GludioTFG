<?php

namespace App\Services;

use App\Models\Reserva;
use App\Models\Cupon;
use App\Models\CuponAplicado;
use Illuminate\Support\Facades\Log;

class CuponService
{
    /**
     * Aplica un cupón a una reserva, actualiza el precio de la reserva y registra el uso.
     * Devuelve el descuento aplicado.
     */
    public function aplicarCuponAReserva(Reserva $reserva, $cupon_id, $totalNuevo, $usuario = null, $ip = null)
    {
        $totalOriginal = (float) $reserva->precio_total;
        $descuento = max(0, round($totalOriginal - $totalNuevo, 2));

        $reserva->update([
            'cupon_id' => $cupon_id,
            'descuento_aplicado' => $descuento,
            'precio_total' => $totalNuevo,
        ]);

        try {

            CuponAplicado::create([
                'reserva_id' => $reserva->id,
                'cupon_id' => $cupon_id,
                'codigo' => Cupon::find($cupon_id)->codigo ?? '',
                'descuento_aplicado' => $descuento,
                'usuario_email' => $usuario?->email ?? $reserva->reservable?->email ?? null,
                'ip_address' => $ip,
            ]);

            Cupon::find($cupon_id)?->increment('usos_realizados');

        } catch (\Throwable $error) {
            Log::warning('No se pudo registrar CuponAplicado: ' . $error->getMessage());
        }

        return $descuento;
    }
}
