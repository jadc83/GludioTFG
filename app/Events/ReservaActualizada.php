<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservaActualizada implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reserva;
    public $meta;

    public function __construct($reserva, ?array $meta = null)
    {
        $this->reserva = $reserva;
        $this->meta = $meta;
    }

    /**
     * Get the channels the event should broadcast on.
     * Broadcast both to the general `reservas` channel and the specific `reservas.{id}` channel.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return [
            new PrivateChannel('reservas'),
            new PrivateChannel('reservas.' . $this->reserva->id),
        ];
    }

    public function broadcastWith()
    {
        return [ 'id' => $this->reserva->id, 'meta' => $this->meta ?? null ];
    }
}
