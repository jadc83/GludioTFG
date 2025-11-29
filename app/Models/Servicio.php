<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    /** @use HasFactory<\Database\Factories\ServicioFactory> */
    use HasFactory;

    protected $fillable = [
        'denominacion',
        'categoria',
        'descripcion_corta',
        'descripcion_larga',
        'pagado',
        'precio',
        'destacado',
        'activo',
    ];

    public function habitaciones()
    {
        return $this->belongsToMany(Habitacion::class, 'habitacion_servicio')
            ->withPivot('cantidad', 'fecha', 'hora', 'precio_extra')
            ->withTimestamps();
    }
}
