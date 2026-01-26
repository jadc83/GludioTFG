<?php

namespace App\Notifications;

use App\Models\RefundRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Contracts\Queue\ShouldQueue;

class RefundRequestProcessedNotification extends Notification implements ShouldQueue
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
        $status = $this->refundRequest->status === 'approved' ? 'aprobada' : 'rechazada';
        $message = $this->refundRequest->status === 'approved'
            ? 'Su solicitud de reembolso ha sido aprobada y el reembolso ha sido procesado.'
            : 'Su solicitud de reembolso ha sido rechazada.';

        return (new MailMessage)
            ->subject("Solicitud de reembolso {$status}")
            ->line($message)
            ->action('Ver reserva', url('/reserva/' . ($this->refundRequest->reserva->localizador ?? '')))
            ->line('Si tiene preguntas, contacte con soporte.');
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
            'status' => $this->refundRequest->status,
        ];
    }
}
