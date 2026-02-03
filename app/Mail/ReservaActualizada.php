<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Models\Reserva;

class ReservaActualizada extends Mailable
{
    use Queueable, SerializesModels;

    /** @var Reserva */
    public $reserva;

    /** @var string|null Path relative en storage/app, p.ej. 'comprobantes/xxx.pdf' */
    public $comprobantePath;

    public function __construct(Reserva $reserva, ?string $comprobantePath = null)
    {
        $this->reserva = $reserva;
        $this->comprobantePath = $comprobantePath;
    }

    public function build()
    {
        // Calcular texto de pago de forma determinista: Abonado (Tarjeta) sólo si existe pago completado con stripe id
        try {
            $this->reserva->loadMissing('pagos');
            $pagosCollection = $this->reserva->pagos ?? collect();
        } catch (\Throwable $e) {
            $pagosCollection = collect();
        }

        $ultimoTarjeta = $pagosCollection->where('estado', 'completado')
                        ->filter(function ($p) { return !empty($p->stripe_payment_intent_id); })
                        ->sortByDesc('pagado_en')
                        ->first();

        if ($ultimoTarjeta) {
            $pago_texto = 'ABONADO (Tarjeta)';
        } else {
            $pago_texto = 'PENDIENTE';
        }

        $mail = $this->subject('Reserva actualizada - ' . ($this->reserva->localizador ?? ''))
            ->view('emails.reserva_actualizada')
            ->with([
                'reserva' => $this->reserva,
                'pago_texto' => $pago_texto,
                'comprobante' => $this->comprobantePath,
            ]);

        if ($this->comprobantePath) {
            $full = storage_path('app/' . ltrim($this->comprobantePath, '/'));
            if (file_exists($full)) {
                $mail->attach($full, [
                    'as' => 'comprobante-' . ($this->reserva->localizador ?? 'reserva') . '.pdf',
                    'mime' => 'application/pdf',
                ]);
            }
        }

        return $mail;
    }
}
