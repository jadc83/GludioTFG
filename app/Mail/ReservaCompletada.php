<?php

namespace App\Mail;

use App\Models\Reserva;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReservaCompletada extends Mailable
{
    use Queueable, SerializesModels;

    public Reserva $reserva;

    /**
     * Create a new message instance.
     */
    public function __construct(Reserva $reserva)
    {
        $this->reserva = $reserva;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject("Reserva completada: {$this->reserva->localizador}")
                    ->view('emails.reserva_completada')
                    ->with(['reserva' => $this->reserva]);
    }
}
