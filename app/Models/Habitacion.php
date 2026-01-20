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

    public function scopeBuscar($query, $termino)
    {
        if (!$termino) return $query;

        return $query->where(function($q) use ($termino) {
            $q->where('numero', 'ILIKE', "%{$termino}%")
              ->orWhere('tipo', 'ILIKE', "%{$termino}%")
              ->orWhere('descripcion', 'ILIKE', "%{$termino}%");
        });
    }

    public function scopeEstado($query, $estado)
    {
        if (!$estado || $estado === 'todos') return $query;
        return $query->where('estado', $estado);
    }

    public function scopeTipo($query, $tipo)
    {
        if (!$tipo || $tipo === 'todos') return $query;
        return $query->where('tipo', $tipo);
    }

    public function scopeCapacidad($query, $capacidad)
    {
        if (!$capacidad || $capacidad === 'todos') return $query;
        return $query->where('capacidad', (int)$capacidad);
    }

    public function scopePrecioMin($query, $precioMin)
    {
        // Precio almacenado eliminado: no filtrar por precio aquí.
        return $query;
    }

    public function scopePrecioMax($query, $precioMax)
    {
        // Precio almacenado eliminado: no filtrar por precio aquí.
        return $query;
    }

    public function scopeDisponiblesEntre($query, $entrada, $salida, $ignoreReservaId = null)
{
    return $query->whereDoesntHave('reservas', function ($q) use ($entrada, $salida, $ignoreReservaId) {
        $q->where(function ($sub) use ($entrada, $salida) {
            $sub->where('check_in', '<', $salida)
                ->where('check_out', '>', $entrada);
        });

        if ($ignoreReservaId) {
            $q->where('reserva_id', '!=', $ignoreReservaId);
        }
    });
}
}
