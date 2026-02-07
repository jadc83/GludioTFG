<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class Tarea
 *
 * @property int $id
 * @property int|null $empleado_id
 * @property int|null $habitacion_id
 * @property string $descripcion
 * @property string $status
 * @property int|null $created_by
 * @property int|null $completed_by
 * @property \Carbon\Carbon|null $completed_at
 */
class Tarea extends Model
{
    use HasFactory;

    protected $fillable = [
        'empleado_id',
        'habitacion_id',
        'descripcion',
        'status',
        'created_by',
        'completed_by',
        'completed_at',
    ];

    /** @var array<string,string> */
    protected $casts = [
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Empleado,\App\Models\Tarea>
     */
    public function empleado(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Habitacion,\App\Models\Tarea>
     */
    public function habitacion(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Habitacion::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\User,\App\Models\Tarea>
     */
    public function creador(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\User,\App\Models\Tarea>
     */
    public function completedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
