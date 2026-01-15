<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservaCreada implements ShouldBroadcastNow
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
        return [
            'id' => $this->reserva->id,
            'status' => $this->reserva->status,
            'check_in' => $this->reserva->check_in,
            'check_out' => $this->reserva->check_out,
        ];
    }
}
