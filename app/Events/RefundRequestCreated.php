<?php

namespace App\Events;

use App\Models\RefundRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundRequestCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public RefundRequest $refundRequest;

    public function __construct(RefundRequest $refundRequest)
    {
        $this->refundRequest = $refundRequest;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('refund-requests');
    }

    public function broadcastWith()
    {
        return ['refund_request' => $this->refundRequest->load('reserva', 'user')];
    }
}
