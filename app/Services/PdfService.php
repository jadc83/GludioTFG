<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use App\Models\Reserva;

class PdfService
{
    public function __construct()
    {

    }

    /**
     * Genera y devuelve el objeto PDF para una reserva (no lo descarga)
     * @param \App\Models\Reserva $reserva
     * @return \Barryvdh\DomPDF\PDF
     */
    public function generarPdf(Reserva $reserva)
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

        // Generar QR como Data URI para que DomPDF lo pueda renderizar sin depender
        // de cargar imágenes remotas. Usamos la API de Google Charts para generar
        // un PNG y lo convertimos a base64.
        $qr_data_uri = null;
        try {
            $qrResponse = Http::withoutVerifying()->timeout(5)->get('https://chart.googleapis.com/chart', [
                'chs' => '150x150',
                'cht' => 'qr',
                'chl' => url('/reserva/' . $reserva->localizador),
            ]);

            if ($qrResponse->successful()) {
                $qrData = $qrResponse->body();
                $qrBase64 = base64_encode($qrData);
                $qr_data_uri = 'data:image/png;base64,' . $qrBase64;
            } else {
                Log::warning('No se pudo generar QR (respuesta no exitosa): ' . $qrResponse->status());

                // Intentar fallback a api.qrserver.com si Google Charts falla
                try {
                    $fallback = Http::withoutVerifying()->timeout(5)->get('https://api.qrserver.com/v1/create-qr-code/', [
                        'size' => '150x150',
                        'data' => url('/reserva/' . $reserva->localizador),
                    ]);

                    if ($fallback->successful()) {
                        $qrData = $fallback->body();
                        $qrBase64 = base64_encode($qrData);
                        $qr_data_uri = 'data:image/png;base64,' . $qrBase64;
                        Log::info('QR generado vía fallback api.qrserver.com para ' . $reserva->localizador);
                    } else {
                        Log::warning('Fallback QR tampoco funcionó: ' . $fallback->status());
                    }
                } catch (\Throwable $e) {
                    Log::warning('Error al descargar QR desde fallback: ' . $e->getMessage());
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Error al descargar QR: ' . $e->getMessage());
        }

        $data['qr_data_uri'] = $qr_data_uri;

        $pdf = Pdf::loadView('pdf.comprobante-reserva', $data);

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
