<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    /** @use HasFactory<\Database\Factories\ClienteFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'telefono',
        'tipo_documento',
        'numero_documento',
        'nacionalidad',
        'direccion',
    ];

        public function reservas()
    {
        return $this->morphMany(Reserva::class, 'reservable');
    }
}
