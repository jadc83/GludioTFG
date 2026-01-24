<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

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

    /**
     * Relación con las reservas del usuario (a través de morphs)
     */
    public function reservas()
    {
        return $this->morphMany(Reserva::class, 'reservable');
    }

    /**
     * Relación con las reservas creadas por el usuario
     */
    public function reservasCreadas()
    {
        return $this->hasMany(Reserva::class, 'booked_by_user_id');
    }
}
