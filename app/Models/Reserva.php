<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reserva extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'reservas';

    protected $fillable = [ 'localizador', 'user_id', 'booked_by_user_id', 'check_in', 'check_out', 'precio_total',
        'status', 'pago', 'notas', 'reservable_type', 'reservable_id', 'tarifa_id'];

    protected $casts = [ 'precio_total' => 'float'];

    public function reservable()
    {
        return $this->morphTo();
    }

    public function bookedBy()
    {
        return $this->belongsTo(User::class, 'booked_by_user_id');
    }


    public function habitaciones()
    {
        return $this->hasMany(HabitacionReserva::class, 'reserva_id');
        }

        public function pagos()
        {
            return $this->hasMany(Pago::class, 'reserva_id');
            }

        public function reembolsos()
        {
            return $this->hasMany(Refund::class, 'reserva_id');
        }

    public function tarifa()
    {
        return $this->belongsTo(Tarifa::class, 'tarifa_id');
    }

    /** Scopes **/

    public function scopeWithReservable($query)
    {
        return $query->with(['reservable']);
    }

    public function scopeStatus($query, $status)
    {
        if (!$status || $status === 'todos') return $query;
        return $query->where('status', $status);
    }

    public function scopeLocalizador($query, $localizador)
    {
        if (!$localizador) return $query;
        return $query->where('localizador', 'ILIKE', "%{$localizador}%");
    }

    public function scopeCliente($query, $clienteNombre)
    {
        if (!$clienteNombre) return $query;

        return $query->whereHasMorph('reservable', [Cliente::class, \App\Models\User::class], function ($q) use ($clienteNombre) {
            $q->where('name', 'ILIKE', "%{$clienteNombre}%");
        });
    }

    public function scopeHabitacion($query, $habitacionNumero)
    {
        if (!$habitacionNumero) return $query;

        return $query->whereHas('habitaciones.habitacion', function ($q) use ($habitacionNumero) {
            $q->where('numero', 'ILIKE', "%{$habitacionNumero}%");
        });
    }

}
