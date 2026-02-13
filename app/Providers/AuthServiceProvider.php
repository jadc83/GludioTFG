<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\\Models\\Model' => 'App\\Policies\\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Gates en castellano para visibilidad genérica
        // `puedeVer`: devuelve true cuando el usuario es el propio recurso (owner) o tiene rol 'admin'
        Gate::define('puedeVer', function (User $user, $target = null) {
            try {
                // Si el target es un User, permitir al propio usuario
                if ($target && $target instanceof \App\Models\User) {
                    if ($user->id === $target->id) {
                        return true;
                    }
                }

                // Si existe la función hasRole, permitir a administradores
                if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
                    return true;
                }
            } catch (\Throwable $e) {
                // En caso de error, no conceder por defecto
            }
            return false;
        });

        // `noPuedeVer`: negación de `puedeVer` para usos explícitos
        Gate::define('noPuedeVer', function (User $user, $target = null) {
            try {
                // Reusar la lógica de puedeVer directamente
                if ($target && $target instanceof \App\Models\User) {
                    if ($user->id === $target->id) {
                        return false;
                    }
                }
                if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
                    return false;
                }
            } catch (\Throwable $e) {
                // ignore
            }
            return true;
        });
    }
}
