<?php

namespace App\Providers;

use App\Models\Reserva;
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
        Reserva::class => \App\Policies\ReservaPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('puedeVer', function (User $user, $target = null) {
            try {
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

            }
            return false;
        });

        Gate::define('noPuedeVer', function (User $user, $target = null) {
            try {

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
