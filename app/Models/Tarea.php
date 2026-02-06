<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    protected $casts = [
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function empleado()
    {
        return $this->belongsTo(Empleado::class);
    }

    public function habitacion()
    {
        return $this->belongsTo(Habitacion::class);
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
