<?php

namespace App\Events;

use App\Models\Habitacion;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class HabitacionUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public $habitacion;

    /**
     * Create a new event instance.
     */
    public function __construct(Habitacion $habitacion)
    {
        // enviar un array simple para evitar serializar relaciones pesadas
        $this->habitacion = $habitacion->toArray();
    }

    /**
     * The channel the event should broadcast on.
     *
     * @return Channel
     */
    public function broadcastOn()
    {
        return new PrivateChannel('habitaciones');
    }

    public function broadcastWith()
    {
        return ['habitacion' => $this->habitacion];
    }
}
