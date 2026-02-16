<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $shared = parent::share($request);

        $user = $request->user();
        $userData = null;
        if ($user) {
            try {
                $roles = [];
                try {
                    $roles = [];
                    if (method_exists($user, 'getRoleNames')) {
                        try {
                            $roles = $user->getRoleNames()->toArray();
                        } catch (\Throwable $__e) {
                            $roles = [];
                        }
                    } elseif (isset($user->roles) && is_iterable($user->roles)) {
                        try {
                            if ($user->roles instanceof \Illuminate\Support\Collection) {
                                $roles = $user->roles->map(fn($r) => $r->name ?? (string) $r)->filter()->values()->toArray();
                            } elseif (is_array($user->roles)) {
                                $roles = array_values($user->roles);
                            }
                        } catch (\Throwable $__e) {
                            $roles = [];
                        }
                    }
                } catch (\Throwable $e) {
                    $roles = [];
                }

                // Mostrar el botón de Panel para administradores siempre.
                // Para el resto se mantiene la política: debe tener al menos
                // un rol y además pertenecer a un departamento (empleado).
                $hasRoles = is_array($roles) && count($roles) > 0;
                $hasDepartamento = !empty($user->empleado?->departamento?->name);
                $isAdmin = in_array('admin', $roles) || in_array('super-admin', $roles) || (method_exists($user, 'hasRole') && $user->hasRole('admin'));
                $canViewPanel = $isAdmin || ($hasRoles && $hasDepartamento);

                $userData = array_merge($user->only([
                    'id', 'name', 'email', 'tipo_documento', 'numero_documento', 'nacionalidad',
                    'direccion', 'ciudad', 'codigo_postal', 'telefono', 'email_verified_at',
                ]), [
                    'roles' => $roles,
                    'can_view_panel' => $canViewPanel,
                    'empleado_departamento' => $user->empleado?->departamento?->name ?? null,
                ]);
            } catch (\Throwable $e) {
                $userData = array_merge($user->only(['id', 'name', 'email']), ['roles' => [], 'can_view_panel' => false]);
            }
        }

        return array_merge($shared, [
            'auth' => ['user' => $userData],
            'csrf_token' => csrf_token(),
            // Expose Stripe public key to Inertia pages so client can initialize Elements in dev + server-rendered pages
            'stripe_public' => config('services.stripe.public'),
        ]);
    }
}
