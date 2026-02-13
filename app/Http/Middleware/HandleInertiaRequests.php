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
                    $roles = $user->getRoleNames()->toArray();
                } catch (\Throwable $e) {
                    $roles = [];
                }

                // Mostrar el botón de Panel sólo si el usuario tiene al menos un rol
                // y además pertenece a un departamento (empleado). Según política:
                // usuarios sin role o sin departamento NO verán el botón.
                $hasRoles = is_array($roles) && count($roles) > 0;
                $hasDepartamento = !empty($user->empleado?->departamento?->name);
                $canViewPanel = $hasRoles && $hasDepartamento;

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
        ]);
    }
}
