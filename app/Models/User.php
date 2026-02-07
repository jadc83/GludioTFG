<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Class User
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $numero_documento
 * @property string|null $telefono
 * @method static \Database\Factories\UserFactory factory(...$parameters)
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tipo_documento',
        'numero_documento',
        'nacionalidad',
        'direccion',
        'ciudad',
        'codigo_postal',
        'telefono',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * @param Builder<\App\Models\User> $query
     * @param string|null $termino
     * @return Builder<\App\Models\User>
     */
    public function scopeBuscar(Builder $query, ?string $termino): Builder
    {
        if (!$termino) return $query;

        return $query->where(function($q) use ($termino) {
            $q->where('name', 'ILIKE', "%{$termino}%")
              ->orWhere('email', 'ILIKE', "%{$termino}%")
              ->orWhere('numero_documento', 'ILIKE', "%{$termino}%")
              ->orWhere('telefono', 'ILIKE', "%{$termino}%");
        });
    }

    /**
     * @param Builder<\App\Models\User> $query
     * @param mixed $tipo
     * @return Builder<\App\Models\User>
     */
    public function scopeTipoDocumento(Builder $query, $tipo): Builder
    {
        if (!$tipo || $tipo === 'todos') return $query;
        return $query->where('tipo_documento', $tipo);
    }

    /**
     * Relación con las reservas del usuario (a través de morphs)
     */
    /**
     * @return MorphMany<\App\Models\Reserva,\App\Models\User>
     */
    public function reservas(): MorphMany
    {
        return $this->morphMany(Reserva::class, 'reservable');
    }

    /**
     * Relación con las reservas creadas por el usuario
     * @return HasMany<\App\Models\Reserva,\App\Models\User>
     */
    public function reservasCreadas(): HasMany
    {
        return $this->hasMany(Reserva::class, 'booked_by_user_id');
    }

    /**
     * Relación con el modelo Empleado (si existe)
     * @return HasOne<\App\Models\Empleado,\App\Models\User>
     */
    public function empleado(): HasOne
    {
        return $this->hasOne(Empleado::class);
    }
}
