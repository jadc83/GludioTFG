<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\Reserva;

class PdfService
{
    public function __construct()
    {
        // placeholder for dependencies (config, logger, etc.)
    }

    /**
     * Genera y devuelve el objeto PDF para una reserva (no lo descarga)
     */
    public function generarComprobantePdf(Reserva $reserva)
    {
        $checkIn = Carbon::parse($reserva->check_in);
        $checkOut = Carbon::parse($reserva->check_out);
        $noches = max(1, $checkIn->diffInDays($checkOut));

        $data = [
            'reserva' => $reserva,
            'cliente' => app(\App\Services\ReservaService::class)->formatearCliente($reserva),
            'noches' => $noches,
            'fecha_generacion' => now()->format('d/m/Y H:i'),
        ];

        $pdf = Pdf::loadView('pdf.comprobante-reserva', $data);
        // Permitir imágenes remotas y parser HTML5 para asegurar renderizado de imágenes/data-uris
        try {
            $pdf->setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudieron aplicar opciones a DomPDF: ' . $e->getMessage());
        }

        return $pdf;
    }
}
