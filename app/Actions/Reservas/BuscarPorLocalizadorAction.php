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
        $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
            ->where('localizador', $localizador)->first();

        if (!$reserva) {
            return ['success' => false, 'error' => 'No se encontró reserva con ese localizador'];
        }

        return [
            'success' => true,
            'reserva' => [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'cliente' => $this->reservaService->formatearCliente($reserva),
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => ($reserva->reembolsos()->sum('amount_cents') ?? 0) / 100,
                'habitaciones' => $reserva->habitaciones->map(function ($hr) {
                    return [
                        'numero' => $hr->habitacion?->numero ?? null,
                        'tipo' => $hr->tipo ?? $hr->habitacion?->tipo ?? null,
                        'precio' => $hr->precio,
                    ];
                })->values(),
            ]
        ];
    }
}
