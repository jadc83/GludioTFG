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
        'tipo',
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

    protected static function booted()
    {
        static::creating(function ($model) {
            if (!isset($model->precio) || $model->precio === null || !is_numeric($model->precio)) {
                // Aplicar fallback seguro para evitar inserciones NULL en la columna precio
                $model->precio = 0;
            }
        });
    }
}
