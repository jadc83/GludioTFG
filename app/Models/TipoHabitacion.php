<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoHabitacion extends Model
{
    use HasFactory;

    protected $table = 'habitaciones_tipos';

    protected $fillable = [
        'slug',
        'nombre',
        'capacidad',
        'precio_base',
        'image_links',
    ];

    protected $casts = [
        'precio_base' => 'decimal:2',
    ];
}
