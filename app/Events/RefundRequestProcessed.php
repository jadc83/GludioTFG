<?php

namespace App\Events;

use App\Models\RefundRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundRequestProcessed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public RefundRequest $refundRequest;

    public function __construct(RefundRequest $refundRequest)
    {
        $this->refundRequest = $refundRequest;
    }

    public function broadcastOn()
    {
        // Broadcast to the specific user channel
        return new PrivateChannel('user.' . $this->refundRequest->user_id);
    }

    public function broadcastWith()
    {
        return ['refund_request' => $this->refundRequest->load('reserva', 'user')];
    }
}
