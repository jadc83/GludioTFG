<?php

namespace App\Mail;

use App\Models\Reserva;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReservaCancelada extends Mailable
{
    use Queueable, SerializesModels;

    public Reserva $reserva;
    public ?string $motivo = null;

    /**
     * Create a new message instance.
     */
    public function __construct(Reserva $reserva, ?string $motivo = null)
    {
        $this->reserva = $reserva;
        $this->motivo = $motivo;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject("Reserva cancelada: {$this->reserva->localizador}")
                    ->view('emails.reserva_cancelada')
                    ->with([ 'reserva' => $this->reserva,'motivo' => $this->motivo, ]);
    }
}
