<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HabitacionReserva extends Model
{
    /** @use HasFactory<\Database\Factories\HabitacionReservaFactory> */
    use HasFactory;

    protected $table = 'habitacion_reserva';

    protected $fillable = [
        'reserva_id',
        'habitacion_id',
        'precio',
        'check_in',
        'check_out',
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'precio' => 'decimal:2',
    ];


    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'reserva_id');
    }

    public function habitacion()
    {
        return $this->belongsTo(Habitacion::class, 'habitacion_id');
    }

    public function huespedes()
    {
        return $this->hasMany(Huesped::class, 'habitacion_reserva_id');
    }
}
