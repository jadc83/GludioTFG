<?php

namespace App\Notifications;

use App\Models\RefundRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Contracts\Queue\ShouldQueue;

class RefundRequestCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected RefundRequest $refundRequest;

    public function __construct(RefundRequest $refundRequest)
    {
        $this->refundRequest = $refundRequest;
    }

    public function via($notifiable)
    {
        return ['mail', 'broadcast'];
    }

    public function toMail($notifiable)
    {
        $line = "Se ha recibido una nueva solicitud de reembolso (Reserva: {$this->refundRequest->reserva->localizador}).";
        return (new MailMessage)
            ->subject('Nueva solicitud de reembolso')
            ->line($line)
            ->action('Ver en Panel', url('/panel'))
            ->line('Revise la solicitud y proceda según corresponda.');
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'refund_request' => $this->refundRequest->load('reserva', 'user')
        ]);
    }

    public function toArray($notifiable)
    {
        return [
            'refund_request_id' => $this->refundRequest->id,
            'reserva_localizador' => $this->refundRequest->reserva->localizador ?? null,
        ];
    }
}
