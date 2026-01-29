<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\RefundRequest;

class RefundRequestCreated extends Mailable
{
    use Queueable, SerializesModels;

    public RefundRequest $refundRequest;

    public function __construct(RefundRequest $refundRequest)
    {
        $this->refundRequest = $refundRequest;
    }

    public function build()
    {
        $rawStatus = strtolower($this->refundRequest->status ?? 'pendiente');
        $statusMap = [
            'pending' => 'pendiente',
            'approved' => 'aprobada',
            'accepted' => 'aceptada',
            'rejected' => 'rechazada',
            'processed' => 'procesada',
        ];
        $statusLabel = $statusMap[$rawStatus] ?? ucfirst($rawStatus);

        $subject = 'Nueva solicitud de reembolso - ' . ($this->refundRequest->reserva->localizador ?? '') . ' (' . ucfirst($statusLabel) . ')';

        return $this->subject($subject)
                    ->view('emails.refund_request_created')
                    ->with(['refundRequest' => $this->refundRequest]);
    }
}
