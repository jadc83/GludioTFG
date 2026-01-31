<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Reserva;
use App\Mail\ReservaCompletada;

class ReservaCreadaNotification extends Notification
{
    public function __construct(public Reserva $reserva)
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
        $mailable = new ReservaCompletada($this->reserva);

        // Si el notifiable es anónimo (Notification::route) o tiene email, aseguramos el destinatario
        try {
            if ($notifiable instanceof \Illuminate\Notifications\AnonymousNotifiable) {
                $to = $notifiable->routeNotificationFor('mail', $this);
                if ($to) $mailable->to($to);
            } elseif (isset($notifiable->email) && !empty($notifiable->email)) {
                $mailable->to($notifiable->email);
            }
        } catch (\Throwable $e) {
            // No bloquear el envío por este ajuste; el canal lo manejará si puede
        }

        return $mailable;
    }

    public function toArray($notifiable)
    {
        return [
            'reserva_id' => $this->reserva->id,
            'localizador' => $this->reserva->localizador ?? null,
            'check_in' => $this->reserva->check_in ?? null,
            'check_out' => $this->reserva->check_out ?? null,
            'precio_total' => $this->reserva->precio_total ?? null,
        ];
    }
}
