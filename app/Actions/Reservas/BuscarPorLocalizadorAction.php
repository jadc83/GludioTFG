<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Services\ReservaService;

class BuscarPorLocalizadorAction
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function handle(string $localizador): array
    {
        $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos', 'reembolsos', 'refundRequests'])
            ->where('localizador', $localizador)->first();

        if (!$reserva) {
            return ['success' => false, 'error' => 'No se encontró reserva con ese localizador'];
        }

        // Return a consistent formatted reservation (same shape used by edit view)
        $formatter = app(\App\Services\ReservaFormatterService::class);
        try {
            $reservaFormateada = $formatter->formatearReservaParaEdicion($reserva, \Carbon\Carbon::parse($reserva->check_in), \Carbon\Carbon::parse($reserva->check_out));
        } catch (\Throwable $_e) {
            $reservaFormateada = [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
            ];
        }

        return [
            'success' => true,
            'reserva' => $reservaFormateada,
        ];
    }
}
