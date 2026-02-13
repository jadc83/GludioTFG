<?php

namespace App\Actions\Reservas;

use App\Models\Reserva;
use App\Services\ReservaFormatterService;
use App\Services\ReservaService;
use Carbon\Carbon;

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

        $formateador = app(ReservaFormatterService::class);
        try {
            $reservaFormateada = $formateador->formatearReservaParaEdicion($reserva, Carbon::parse($reserva->check_in), Carbon::parse($reserva->check_out));
        } catch (\Throwable $_e) {
            $reservaFormateada = [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
            ];
        }

        // Incluir listado de pagos crudos (mínimos) para que el cliente pueda
        // representar el estado del pago sin depender únicamente del campo `pago`.
        $pagos = $reserva->pagos->map(function ($p) {
            return [
                'id' => $p->id ?? null,
                'monto' => isset($p->monto) ? $p->monto : (isset($p->amount_cents) ? round(($p->amount_cents ?? 0) / 100, 2) : null),
                'estado' => $p->estado ?? $p->status ?? null,
                'reembolso_estado' => $p->reembolso_estado ?? null,
                'created_at' => isset($p->created_at) ? $p->created_at->toIso8601String() : null,
            ];
        })->values()->toArray();

        return [
            'success' => true,
            'reserva' => array_merge($reservaFormateada, ['pagos' => $pagos]),
        ];
    }
}
