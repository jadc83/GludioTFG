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
        $channels = ['broadcast', 'database'];
        if ($notifiable instanceof \Illuminate\Notifications\AnonymousNotifiable) {
            // If using route('mail', ...), only mail is supported for anonymous notifiable
            return ['mail'];
        }
        if (isset($notifiable->email) && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail($notifiable)
    {
        $mailable = new \App\Mail\RefundRequestCreated($this->refundRequest);
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
            'reserva_localizador' => $this->refundRequest->reserva->localizador ?? null,
            'requested_amount_cents' => $this->refundRequest->requested_amount_cents ?? null,
            'status' => $this->refundRequest->status ?? null,
            'user_id' => $this->refundRequest->user_id ?? null,
        ];
    }
}
