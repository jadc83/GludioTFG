<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CuponAplicado extends Model
{
    protected $fillable = [
        'reserva_id',
        'cupon_id',
        'codigo',
        'descuento_aplicado',
        'usuario_email',
        'ip_address',
    ];

    public function reserva()
    {
        return $this->belongsTo(Reserva::class);
    }

    public function cupon()
    {
        return $this->belongsTo(Cupon::class);
    }
}
