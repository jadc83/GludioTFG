<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * Denegar acceso a empleados de ciertos departamentos (limpieza, mantenimiento).
     * Si la petición espera JSON, devuelve un JSON 403, si no, aborta con 403.
     */
    protected function denegarAccesoLimpiezaYMantenimiento(): void
    {
        $user = auth()->user();
        $dept = strtolower($user?->empleado?->departamento?->name ?? '');
        $forbidden = in_array($dept, ['limpieza', 'mantenimiento'], true);

        if ($forbidden) {
            // If the request is an Inertia request, return a normal 403 page response
            // (Inertia expects full responses, not plain JSON). Detect Inertia via
            // the `X-Inertia` header. For other AJAX/JSON requests, return JSON.
            $isInertia = !is_null(request()->header('X-Inertia'));
            $wantsJson = !$isInertia && (request()->wantsJson() || request()->ajax() || request()->header('X-Requested-With') === 'XMLHttpRequest' || (strtolower(request()->header('accept') ?? '') === 'application/json'));

            if ($wantsJson) {
                abort(response()->json(['success' => false, 'message' => 'Acceso denegado'], 403));
            }

            abort(403, 'Acceso denegado');
        }
    }

}
