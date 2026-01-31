<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use App\Models\Reserva;
use App\Mail\ReservaActualizada as ReservaActualizadaMail;

class ReservaActualizadaNotification extends Notification
{
    public function __construct(public Reserva $reserva, public ?string $comprobantePath = null)
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
        $mailable = new ReservaActualizadaMail($this->reserva, $this->comprobantePath);

        // Asegurar destinatario cuando la notificación se envía vía Notification::route() o el notifiable tiene email
        try {
            if ($notifiable instanceof \Illuminate\Notifications\AnonymousNotifiable) {
                $to = $notifiable->routeNotificationFor('mail', $this);
                if ($to) $mailable->to($to);
            } elseif (isset($notifiable->email) && !empty($notifiable->email)) {
                $mailable->to($notifiable->email);
            }
        } catch (\Throwable $e) {
            // no bloquear el envío
        }

        return $mailable;
    }

    public function toArray($notifiable)
    {
        return [
            'reserva_id' => $this->reserva->id,
            'localizador' => $this->reserva->localizador ?? null,
            'precio_total' => $this->reserva->precio_total ?? null,
        ];
    }
}
