<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Foto extends Model
{
    protected $fillable = ['habitacion_id', 'ruta', 'orden'];

    public function habitacion()
    {
        return $this->belongsTo(Habitacion::class);
    }
}
