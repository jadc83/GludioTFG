<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reserva extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'reservas';

    protected $fillable = [
        'localizador',
        'user_id',
        'check_in',
        'check_out',
        'precio_total',
        'status',
        'pago',
        'notas',
    ];

    protected $casts = [
        'precio_total' => 'float',
    ];

    public function reservable()
    {
        return $this->morphTo();
    }

    public function habitaciones()
    {
        return $this->hasMany(HabitacionReserva::class, 'reserva_id');
    }
}
