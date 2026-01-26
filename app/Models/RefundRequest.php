<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefundRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'reserva_id',
        'pago_id',
        'requested_amount_cents',
        'reason_code',
        'notes',
        'user_id',
        'status',
        'admin_id',
        'admin_reason',
        'processed_at',
        'stripe_refund_id',
    ];

    protected $casts = [
        'requested_amount_cents' => 'integer',
        'processed_at' => 'datetime',
    ];

    public function reserva()
    {
        return $this->belongsTo(Reserva::class);
    }

    public function pago()
    {
        return $this->belongsTo(Pago::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
