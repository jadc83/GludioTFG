<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class Refund
 *
 * @property int $id
 * @property int $pago_id
 * @property int $reserva_id
 * @property int $amount_cents
 * @property string $currency
 * @property string $status
 * @property string|null $stripe_refund_id
 * @property string|null $reason
 * @property \Carbon\Carbon|null $created_at
 * @property-read \App\Models\Pago|null $pago
 * @property-read \App\Models\Reserva|null $reserva
 */
class Refund extends Model
{
    protected $table = 'reembolsos';
    protected $fillable = [
        'pago_id', 'reserva_id', 'stripe_refund_id', 'amount_cents', 'currency', 'status', 'reason', 'stripe_response'
    ];

    /** @var array<string,string> */
    protected $casts = [
        'stripe_response' => 'array',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Pago,\App\Models\Refund>
     */
    public function pago(): BelongsTo
    {
        return $this->belongsTo(Pago::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Reserva,\App\Models\Refund>
     */
    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }
}
