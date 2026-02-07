<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class Tarifa
 *
 * @property int $id
 * @property string $nombre
 * @property float $precio
 */
class Tarifa extends Model
{
    use HasFactory;

    protected $table = 'tarifas';

    protected $fillable = ['nombre','slug', 'modificador_precio'];

    /** @var array<string,string> */
    protected $casts = [ 'modificador_precio' => 'decimal:2' ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Reserva,\App\Models\Tarifa>
     */
    public function reservas(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Reserva::class, 'tarifa_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<\App\Models\Reserva,\App\Models\Tarifa>
     */
    public function reservasMultiple(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Reserva::class, 'reserva_tarifas');
    }
}
