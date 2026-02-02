<?php

namespace App\Listeners;

use App\Events\PagoConfirmado;
use App\Mail\PagoConfirmado as MailPagoConfirmado;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class EnviarEmailPagoConfirmado implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PagoConfirmado $event): void
    {
        $reserva = $event->reserva;
        try {
            Mail::to($reserva->reservable->email)->send(new MailPagoConfirmado($reserva));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnviarEmailPagoConfirmado failed: ' . $e->getMessage());
        }
    }
}
