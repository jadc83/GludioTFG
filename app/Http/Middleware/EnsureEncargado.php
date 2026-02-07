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
        // Allow both 'encargado' and 'admin' to access the panel
        if (!$user || !method_exists($user, 'hasAnyRole') || !$user->hasAnyRole(['encargado', 'admin'])) {
            abort(403);
        }
        return $next($request);
    }
}
