<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class RefundRequest
 *
 * @property int $id
 * @property int $reserva_id
 * @property int $pago_id
 * @property int $requested_amount_cents
 * @property string $status
 * @property string|null $reason_code
 * @property string|null $notes
 * @property \Carbon\Carbon|null $pending_check_in
 * @property \Carbon\Carbon|null $pending_check_out
 * @property float|null $pending_nuevo_total
 * @property int|null $admin_id
 * @property string|null $admin_reason
 * @property \Carbon\Carbon|null $processed_at
 * @property int|null $processed_refund_amount_cents
 * @property string|null $stripe_refund_id
 * @property \Carbon\Carbon|null $created_at
 * @property-read \App\Models\Reserva $reserva
 * @property-read \App\Models\Pago $pago
 * @property-read \App\Models\User $user
 */
class RefundRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'reserva_id',
        'pago_id',
        'requested_amount_cents',
        'reason_code',
        'notes',
        'pending_check_in',
        'pending_check_out',
        'pending_nuevo_total',
        'user_id',
        'status',
        'admin_id',
        'admin_reason',
        'processed_at',
        'stripe_refund_id',
        'processed_refund_amount_cents',
    ];

    /** @var array<string,string> */
    protected $casts = [
        'requested_amount_cents' => 'integer',
        'processed_at' => 'datetime',
        'pending_check_in' => 'date',
        'pending_check_out' => 'date',
        'pending_nuevo_total' => 'decimal:2',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Reserva,\App\Models\RefundRequest>
     */
    public function reserva(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Pago,\App\Models\RefundRequest>
     */
    public function pago(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Pago::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\User,\App\Models\RefundRequest>
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\User,\App\Models\RefundRequest>
     */
    public function admin(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
