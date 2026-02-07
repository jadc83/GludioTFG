<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class Pago
 *
 * @property int $id
 * @property int $reserva_id
 * @property float $monto
 * @property string $estado
 * @property string|null $stripe_payment_intent_id
 * @property string|null $stripe_checkout_session_id
 * @property string|null $reembolso_estado
 * @property-read \App\Models\Reserva $reserva
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Refund> $reembolsos
 */
class Pago extends Model
{
    protected $fillable = [
        'reserva_id',
        'stripe_payment_intent_id',
        'stripe_checkout_session_id',
        'monto',
        'moneda',
        'estado',
        'descripcion',
        'stripe_response',
        'pagado_en',
        'reembolso_estado',
    ];

    /** @var array<string,string> */
    protected $casts = [
        'stripe_response' => 'array',
        'pagado_en' => 'datetime',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Reserva,\App\Models\Pago>
     */
    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Refund,\App\Models\Pago>
     */
    public function reembolsos(): HasMany
    {
        return $this->hasMany(Refund::class, 'pago_id');
    }

    public function marcarComoPagado(): void
    {
        $this->update([
            'estado' => 'completado',
            'pagado_en' => now(),
        ]);
    }

    public function marcarComoFallido(): void
    {
        $this->update([
            'estado' => 'fallido',
        ]);
    }

    public function marcarComoReembolsado(): void
    {
        $this->update([
            'estado' => 'reembolsado',
        ]);
    }
}
