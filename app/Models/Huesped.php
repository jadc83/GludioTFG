<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class Huesped
 *
 * @property int $id
 * @property int|null $habitacion_reserva_id
 * @property string $nombre
 * @property string|null $documento
 * @property \Carbon\Carbon|null $check_in
 * @property \Carbon\Carbon|null $check_out
 * @method static \Database\Factories\HuespedFactory factory(...$parameters)
 */
class Huesped extends Model
{
    /** @use HasFactory<\Database\Factories\HuespedFactory> */
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

    /** @var array<string,string> */
    protected $casts = [
        'fecha_nacimiento' => 'date',
        'es_titular' => 'boolean',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\HabitacionReserva,\App\Models\Huesped>
     */
    public function habitacionAsignada(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(HabitacionReserva::class, 'habitacion_reserva_id');
    }
}
