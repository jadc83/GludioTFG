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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => ($request->user() ? array_merge($request->user()->only([
                    'id', 'name', 'email', 'tipo_documento', 'numero_documento', 'nacionalidad',
                    'direccion', 'ciudad', 'codigo_postal', 'telefono', 'email_verified_at',
                ]), [
                    'roles' => $request->user()->getRoleNames()->toArray(),
                    'is_encargado' => $request->user()->hasRole('encargado'),
                    'is_admin' => $request->user()->hasRole('admin'),
                ]) : null),
            ],
            'csrf_token' => csrf_token(),
        ];
    }
}
