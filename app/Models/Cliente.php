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

    public function scopeBuscar($query, $termino)
    {
        if (!$termino) return $query;

        return $query->where(function($q) use ($termino) {
            $q->where('name', 'ILIKE', "%{$termino}%")
              ->orWhere('email', 'ILIKE', "%{$termino}%")
              ->orWhere('numero_documento', 'ILIKE', "%{$termino}%")
              ->orWhere('telefono', 'ILIKE', "%{$termino}%");
        });
    }

    public function scopeTipoDocumento($query, $tipo)
    {
        if (!$tipo || $tipo === 'todos') return $query;
        return $query->where('tipo_documento', $tipo);
    }

    public function reservas()
    {
        return $this->morphMany(Reserva::class, 'reservable');
    }
}
