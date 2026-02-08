<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Habitacion
 *
 * @property int $id
 * @property string $numero
 * @property string $tipo
 * @property int $capacidad
 * @property string $estado
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\HabitacionReserva> $reservas
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Foto> $fotos
 * @method static \Database\Factories\HabitacionFactory factory(...$parameters)
 */
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

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\HabitacionReserva,\App\Models\Habitacion>
     */
    public function reservas(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(HabitacionReserva::class, 'habitacion_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Foto,\App\Models\Habitacion>
     */
    public function fotos(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        $rel = $this->hasMany(Foto::class);
        $rel->getQuery()->orderBy('orden');
        return $rel;
    }

/**
 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<\App\Models\Servicio,\App\Models\Habitacion>
 */
public function servicios(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
{
    return $this->belongsToMany(Servicio::class, 'habitacion_servicio')
                ->withPivot('cantidad', 'fecha', 'hora', 'precio_extra')
                ->withTimestamps();
}

    public function scopeBuscar(\Illuminate\Database\Eloquent\Builder $query, ?string $termino): \Illuminate\Database\Eloquent\Builder
    {
        if (!$termino) return $query;

        return $query->where(function($q) use ($termino) {
            $q->where('numero', 'ILIKE', "%{$termino}%")
              ->orWhere('tipo', 'ILIKE', "%{$termino}%")
              ->orWhere('descripcion', 'ILIKE', "%{$termino}%");
        });
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion> $query
     * @param string|int|null $estado
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion>
     */
    public function scopeEstado(\Illuminate\Database\Eloquent\Builder $query, $estado): \Illuminate\Database\Eloquent\Builder
    {
        if (!$estado || $estado === 'todos') return $query;
        return $query->where('estado', $estado);
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion> $query
     * @param string|int|null $tipo
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion>
     */
    public function scopeTipo(\Illuminate\Database\Eloquent\Builder $query, $tipo): \Illuminate\Database\Eloquent\Builder
    {
        if (!$tipo || $tipo === 'todos') return $query;
        return $query->where('tipo', $tipo);
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion> $query
     * @param string|int|null $capacidad
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion>
     */
    public function scopeCapacidad(\Illuminate\Database\Eloquent\Builder $query, $capacidad): \Illuminate\Database\Eloquent\Builder
    {
        if (!$capacidad || $capacidad === 'todos') return $query;
        return $query->where('capacidad', (int)$capacidad);
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion> $query
     * @param int|float|string|null $precioMin
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion>
     */
    public function scopePrecioMin(\Illuminate\Database\Eloquent\Builder $query, $precioMin): \Illuminate\Database\Eloquent\Builder
    {
        // Precio almacenado eliminado: no filtrar por precio aquí.
        return $query;
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion> $query
     * @param int|float|string|null $precioMax
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion>
     */
    public function scopePrecioMax(\Illuminate\Database\Eloquent\Builder $query, $precioMax): \Illuminate\Database\Eloquent\Builder
    {
        // Precio almacenado eliminado: no filtrar por precio aquí.
        return $query;
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion> $query
     * @param \Carbon\Carbon|string $entrada
     * @param \Carbon\Carbon|string $salida
     * @param int|null $ignoreReservaId
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Habitacion>
     */
    public function scopeDisponiblesEntre(\Illuminate\Database\Eloquent\Builder $query, $entrada, $salida, $ignoreReservaId = null): \Illuminate\Database\Eloquent\Builder
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

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Tarea,\App\Models\Habitacion>
     */
    public function tareas(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\Tarea::class, 'habitacion_id');
    }
}

