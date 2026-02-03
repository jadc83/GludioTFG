<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $fillable = [
        'reserva_id',
        'stripe_payment_intent_id',
        'monto',
        'moneda',
        'estado',
        'descripcion',
        'stripe_response',
        'pagado_en',
        'reembolso_estado',
    ];

    protected $casts = [
        'stripe_response' => 'array',
        'pagado_en' => 'datetime',
    ];

    public function reserva()
    {
        return $this->belongsTo(Reserva::class);
    }

    public function reembolsos()
    {
        return $this->hasMany(Refund::class, 'pago_id');
    }

    public function marcarComoPagado()
    {
        $this->update([
            'estado' => 'completado',
            'pagado_en' => now(),
        ]);
    }

    public function marcarComoFallido()
    {
        $this->update([
            'estado' => 'fallido',
        ]);
    }

    public function marcarComoReembolsado()
    {
        $this->update([
            'estado' => 'reembolsado',
        ]);
    }
}
