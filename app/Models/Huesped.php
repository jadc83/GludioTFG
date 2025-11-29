<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Huesped extends Model
{
    use HasFactory;


    protected $table = 'huespedes';


    protected $fillable = [
        'habitacion_reserva_id',
        'nombre',
        'apellidos',
        'documento_tipo',
        'documento',
        'fecha_nacimiento',
        'es_titular',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'es_titular' => 'boolean',
    ];

    public function habitacionAsignada()
    {
        return $this->belongsTo(HabitacionReserva::class, 'habitacion_reserva_id');
    }
}
