<?php

namespace App\Actions\Estadisticas;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Services\EstadisticaService;

class GetOcupacionAction
{
    public static function handle(Request $request)
    {
        $validados = $request->validate([
            'fecha_desde' => 'nullable|date_format:Y-m-d',
            'fecha_hasta' => 'nullable|date_format:Y-m-d',
        ]);

        $fechaDesde = $validados['fecha_desde'] ?? null;
        $fechaHasta = $validados['fecha_hasta'] ?? null;

        if (! $fechaDesde && ! $fechaHasta) {
            $fechaDesde = Carbon::now()->format('Y-m-d');
            $fechaHasta = $fechaDesde;
        } elseif ($fechaDesde && ! $fechaHasta) {
            $fechaHasta = $fechaDesde;
        } elseif (! $fechaDesde && $fechaHasta) {
            $fechaDesde = $fechaHasta;
        }

        $desde = Carbon::parse($fechaDesde);
        $hasta = Carbon::parse($fechaHasta);

        if ($hasta->lessThan($desde)) {
            [$desde, $hasta] = [$hasta, $desde];
        }

        $service = new EstadisticaService();
        $datos = $service->calcularOcupacion($desde, $hasta);

        return response()->json([
            'success' => true,
            'data' => array_merge($datos, [
                'fecha_desde' => $desde->format('Y-m-d'),
                'fecha_hasta' => $hasta->format('Y-m-d'),
            ]),
        ]);
    }
}
