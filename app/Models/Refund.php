<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    protected $table = 'reembolsos';
    protected $fillable = [
        'pago_id', 'reserva_id', 'stripe_refund_id', 'amount_cents', 'currency', 'status', 'reason', 'stripe_response'
    ];

    protected $casts = [
        'stripe_response' => 'array',
    ];

    public function pago()
    {
        return $this->belongsTo(Pago::class);
    }

    public function reserva()
    {
        return $this->belongsTo(Reserva::class);
    }
}
