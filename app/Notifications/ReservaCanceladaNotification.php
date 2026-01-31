<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use App\Models\Reserva;
use App\Mail\ReservaCancelada as ReservaCanceladaMail;

class ReservaCanceladaNotification extends Notification
{
    public function __construct(public Reserva $reserva, public ?string $motivo = null)
    {
    }

    public function via($notifiable)
    {
        $channels = ['database'];
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
        $mailable = new ReservaCanceladaMail($this->reserva, $this->motivo);
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

    public function toArray($notifiable)
    {
        return [
            'reserva_id' => $this->reserva->id,
            'localizador' => $this->reserva->localizador ?? null,
            'motivo' => $this->motivo ?? null,
        ];
    }
}
