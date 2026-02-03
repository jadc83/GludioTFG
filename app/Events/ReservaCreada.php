<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservaCreada
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reserva;

    public function __construct($reserva)
    {
        $this->reserva = $reserva;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('reservas');
    }

    public function broadcastWith()
    {
        return [ 'id' => $this->reserva->id ];
    }
}
