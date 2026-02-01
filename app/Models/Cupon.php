<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cupon extends Model
{
    protected $table = 'cupones';

    protected $fillable = [
        'codigo',
        'tipo',
        'valor',
        'usos_maximos',
        'usos_realizados',
        'fecha_inicio',
        'fecha_fin',
        'activo',
        'descripcion',
    ];

    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
        'activo' => 'boolean',
    ];

    public function aplicados()
    {
        return $this->hasMany(CuponAplicado::class);
    }
}
