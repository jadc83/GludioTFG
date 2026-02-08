<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureEncargado
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        // Allow panel access to admin, encargado, operarios/auxiliares of certain departments
        if (!$user) {
            abort(403);
        }

        $departamento = strtolower($user->empleado?->departamento?->name ?? '');

        $isAdminOrEncargado = method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'encargado']);
        $isOperario = method_exists($user, 'hasRole') && $user->hasRole('operario') && in_array($departamento, ['mantenimiento','recepcion']);
        $isAuxiliarRecepcion = method_exists($user, 'hasRole') && $user->hasRole('auxiliar') && $departamento === 'recepcion';

        if (!($isAdminOrEncargado || $isOperario || $isAuxiliarRecepcion)) {
            abort(403);
        }
        return $next($request);
    }
}
