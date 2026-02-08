<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Turno extends Model
{
    use HasFactory;

    protected $table = 'turnos';

    protected $fillable = [
        'empleado_id',
        'created_by',
        'actividad',
        'starts_at',
        'ends_at',
        'meta',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'meta' => 'array',
    ];

    public function empleado()
    {
        return $this->belongsTo(Empleado::class);
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
