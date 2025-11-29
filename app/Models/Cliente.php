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
        'teléfono',
        'tipo_documento',
        'numero_documento',
        'nacionalidad',
        'dirección',
    ];

        public function reservas()
    {
        return $this->morphMany(Reserva::class, 'reservable');
    }
}
