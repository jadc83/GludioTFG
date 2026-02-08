<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{MorphTo, BelongsTo, HasMany, HasOne, BelongsToMany};
use Illuminate\Database\Eloquent\Builder;

/**
 * Class Reserva
 *
 * @property int $id
 * @property string $localizador
 * @property string $check_in
 * @property string $check_out
 * @property float $precio_total
 * @property string $status
 * @property string|null $pago
 * @property string|null $notas
 * @property float|null $descuento_aplicado
 * @property-read \Illuminate\Database\Eloquent\Model|null $reservable
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\HabitacionReserva> $habitaciones
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Pago> $pagos
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Refund> $reembolsos
 * @property int|null $reservable_id
 * @property string|null $reservable_type
 * @property int|null $user_id
 * @property int|null $booked_by_user_id
 * @property \Carbon\Carbon|null $created_at
 * @method static \Database\Factories\ReservaFactory factory(...$parameters)
 */
class Reserva extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'reservas';

    protected $fillable = [ 'localizador', 'user_id', 'booked_by_user_id', 'check_in', 'check_out', 'precio_total',
        'status', 'pago', 'notas', 'reservable_type', 'reservable_id', 'tarifa_id', 'cupon_id', 'descuento_aplicado'];

    protected $casts = [ 'precio_total' => 'float', 'descuento_aplicado' => 'float'];

    public function reservable(): MorphTo
    {
        return $this->morphTo();
    }

    protected static function booted()
    {
        // Cuando una reserva se marca como borrada (soft-delete), desvincular sus placeholders
        static::deleted(function (Reserva $reserva) {
            try {
                // Eliminar placeholders (registros sin habitacion_id) porque la política
                // de la empresa indica que las reservas canceladas no se restaurarán.
                \App\Models\HabitacionReserva::where('reserva_id', $reserva->id)
                    ->whereNull('habitacion_id')
                    ->delete();
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Error eliminando placeholders al borrar reserva: ' . $e->getMessage());
            }
        });
    }

    public function bookedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booked_by_user_id');
    }


    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\HabitacionReserva,\App\Models\Reserva>
     */
    public function habitaciones(): HasMany
    {
        return $this->hasMany(HabitacionReserva::class, 'reserva_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Pago,\App\Models\Reserva>
     */
    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'reserva_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Refund,\App\Models\Reserva>
     */
    public function reembolsos(): HasMany
    {
        return $this->hasMany(Refund::class, 'reserva_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\RefundRequest,\App\Models\Reserva>
     */
    public function refundRequests(): HasMany
    {
        return $this->hasMany(\App\Models\RefundRequest::class, 'reserva_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Tarifa,\App\Models\Reserva>
     */
    public function tarifa(): BelongsTo
    {
        return $this->belongsTo(Tarifa::class, 'tarifa_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<\App\Models\Tarifa,\App\Models\Reserva>
     */
    public function tarifas(): BelongsToMany
    {
        return $this->belongsToMany(Tarifa::class, 'reserva_tarifas');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<\App\Models\CuponAplicado,\App\Models\Reserva>
     */
    public function cuponAplicado(): HasOne
    {
        return $this->hasOne(CuponAplicado::class, 'reserva_id');
    }

    /** Scopes **/

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva> $query
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva>
     */
    public function scopeWithReservable(Builder $query): Builder
    {
        return $query->with(['reservable']);
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva> $query
     * @param mixed $status
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva>
     */
    public function scopeStatus(Builder $query, $status): Builder
    {
        if (!$status || $status === 'todos') return $query;
        return $query->where('status', $status);
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva> $query
     * @param string|null $localizador
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva>
     */
    public function scopeLocalizador(Builder $query, ?string $localizador): Builder
    {
        if (!$localizador) return $query;
        return $query->where('localizador', 'ILIKE', "%{$localizador}%");
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva> $query
     * @param string|null $clienteNombre
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva>
     */
    public function scopeCliente(Builder $query, ?string $clienteNombre): Builder
    {
        if (!$clienteNombre) return $query;

        return $query->whereHasMorph('reservable', [Cliente::class, \App\Models\User::class], function (Builder $q) use ($clienteNombre) {
            $q->where('name', 'ILIKE', "%{$clienteNombre}%");
        });
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva> $query
     * @param string|null $habitacionNumero
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Reserva>
     */
    public function scopeHabitacion(Builder $query, ?string $habitacionNumero): Builder
    {
        if (!$habitacionNumero) return $query;

        return $query->whereHas('habitaciones.habitacion', function (Builder $q) use ($habitacionNumero) {
            $q->where('numero', 'ILIKE', "%{$habitacionNumero}%");
        });
    }

}
