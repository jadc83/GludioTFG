<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Habitacion extends Model
{
    /** @use HasFactory<\Database\Factories\HabitacionFactory> */
    use HasFactory, SoftDeletes;
    protected $table = 'habitaciones';
    protected $fillable = [
        'numero',
        'tipo',
        'precio_noche',
        'capacidad',
        'estado',
        'descripcion',
        'notas',
    ];

    public function reservas()
    {
        return $this->hasMany(HabitacionReserva::class, 'habitacion_id');
    }

    public function fotos()
    {
        return $this->hasMany(Foto::class)->orderBy('orden');
    }

public function servicios()
{
    return $this->belongsToMany(Servicio::class, 'habitacion_servicio')
                ->withPivot('cantidad', 'fecha', 'hora', 'precio_extra')
                ->withTimestamps();
}
}
