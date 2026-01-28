<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** @use HasFactory<\Database\Factories\EmpleadoFactory> */
class Empleado extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'numero_empleado',
        'departamento',
        'puesto',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
