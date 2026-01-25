<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarifa extends Model
{
    use HasFactory;

    protected $table = 'tarifas';

    protected $fillable = ['nombre','slug', 'modificador_precio'];

    protected $casts = [ 'modificador_precio' => 'decimal:2' ];

    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'tarifa_id');
    }
}
