<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use App\Models\TipoHabitacion;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Compartir con Inertia los precios base por tipo de habitación
        // Estructura: { slug: { nombre, capacidad, precio_base } }
        try {
            $tipos = TipoHabitacion::all(['slug', 'nombre', 'capacidad', 'precio_base'])->mapWithKeys(function ($t) {
                return [$t->slug => [
                    'nombre' => $t->nombre,
                    'capacidad' => (int) $t->capacidad,
                    'precio_base' => (float) $t->precio_base,
                ]];
            })->toArray();

            Inertia::share('tiposHabitacion', $tipos);
        } catch (\Throwable $e) {
            // En caso de error (migraciones no ejecutadas) compartir un array vacío
            Inertia::share('tiposHabitacion', []);
        }
    }
}
