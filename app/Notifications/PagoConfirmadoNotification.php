<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Pago;

class PagoConfirmadoNotification extends Notification
{
    public function __construct(public Pago $pago)
    {
    }

    public function via($notifiable)
    {
        $channels = ['database'];
        // enviar por mail si el notifiable tiene email o es anónimo (route)
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
        $reserva = $this->pago->reserva->fresh(['reservable']);
        $esTarjeta = !empty($this->pago->stripe_payment_intent_id);

        $subject = "Pago recibido - Reserva {$reserva->localizador}";

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Hola ' . ($reserva->reservable?->name ?? ''))
            ->line("Hemos recibido el pago para la reserva {$reserva->localizador}.")
            ->line('Estado: ' . ($esTarjeta ? 'Abonado (Tarjeta)' : 'Pendiente'))
            ->line('Importe: €' . number_format($this->pago->monto, 2))
            ->line('Gracias.');
    }

    public function toArray($notifiable)
    {
        return [
            'pago_id' => $this->pago->id,
            'reserva_id' => $this->pago->reserva_id,
            'monto' => $this->pago->monto,
            'stripe_payment_intent_id' => $this->pago->stripe_payment_intent_id ?? null,
        ];
    }
}
