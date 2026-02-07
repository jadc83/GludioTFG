<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class HabitacionReserva
 *
 * @property int $id
 * @property int $reserva_id
 * @property int $habitacion_id
 * @property float $precio
 * @property \Carbon\Carbon|null $check_in
 * @property \Carbon\Carbon|null $check_out
 * @property string $tipo
 * @property-read \App\Models\Reserva $reserva
 * @property-read \App\Models\Habitacion $habitacion
 * @method static \Database\Factories\HabitacionReservaFactory factory(...$parameters)
 */
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

    /** @var array<string,string> */
    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'precio' => 'decimal:2',
    ];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Reserva,\App\Models\HabitacionReserva>
     */
    public function reserva(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Reserva::class, 'reserva_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Habitacion,\App\Models\HabitacionReserva>
     */
    public function habitacion(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Habitacion::class, 'habitacion_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Huesped,\App\Models\HabitacionReserva>
     */
    public function huespedes(): \Illuminate\Database\Eloquent\Relations\HasMany
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
