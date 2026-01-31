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
        $channels = ['broadcast', 'database'];
        if ($notifiable instanceof \Illuminate\Notifications\AnonymousNotifiable) {
            return ['mail'];
        }
        if (isset($notifiable->email) && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail($notifiable)
    {
        $mailable = new \App\Mail\RefundRequestProcessed($this->refundRequest);
        try {
            if ($notifiable instanceof \Illuminate\Notifications\AnonymousNotifiable) {
                $to = $notifiable->routeNotificationFor('mail', $this);
                if ($to) $mailable->to($to);
            } elseif (isset($notifiable->email) && !empty($notifiable->email)) {
                $mailable->to($notifiable->email);
            }
        } catch (\Throwable $e) {
            // ignore
        }
        return $mailable;
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
            'processed_at' => $this->refundRequest->processed_at ?? null,
        ];
    }
}
