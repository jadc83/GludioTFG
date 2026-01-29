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
        $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos', 'reembolsos'])
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
                'reembolsos' => $reserva->reembolsos->sortBy('created_at')->values()->map(function ($r) use ($reserva) {
                    $amount = ($r->amount_cents ?? 0) / 100;
                    $tipo = 'parcial';
                    $cumulative = 0; // compute tipo based on cumulative sum up to this refund
                    // compute cumulative up to this refund
                    foreach ($reserva->reembolsos->sortBy('created_at') as $rr) {
                        $cumulative += (($rr->amount_cents ?? 0) / 100);
                        if ($rr->id == $r->id) break;
                    }
                    if (($reserva->precio_total ?? 0) > 0 && $cumulative >= ($reserva->precio_total ?? 0)) {
                        $tipo = 'completo';
                    }

                    return [
                        'id' => $r->id,
                        'monto' => round($amount, 2),
                        'status' => $r->status,
                        'reason' => $r->reason ?? null,
                        'created_at' => $r->created_at?->format('Y-m-d H:i:s') ?? null,
                        'tipo' => $tipo,
                    ];
                })->values(),
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
