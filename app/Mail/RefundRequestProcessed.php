<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\RefundRequest;

class RefundRequestProcessed extends Mailable
{
    use Queueable, SerializesModels;

    public RefundRequest $refundRequest;

    public function __construct(RefundRequest $refundRequest)
    {
        $this->refundRequest = $refundRequest;
    }

    public function build()
    {
        $rawStatus = strtolower($this->refundRequest->status ?? 'procesada');
        $statusMap = [
            'pending' => 'pendiente',
            'approved' => 'aprobada',
            'accepted' => 'aceptada',
            'rejected' => 'rechazada',
            'processed' => 'procesada',
        ];
        $statusLabel = $statusMap[$rawStatus] ?? ucfirst($rawStatus);
        $subject = 'Solicitud de reembolso ' . $statusLabel;

        return $this->subject($subject)
                    ->view('emails.refund_request_processed')
                    ->with(['refundRequest' => $this->refundRequest]);
    }
}
