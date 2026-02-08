<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class ConvertRedirectsToJson
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        \Illuminate\Support\Facades\Log::info('ConvertRedirectsToJson: called', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'is_ajax' => $request->expectsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest',
        ]);

        $response = $next($request);

        \Illuminate\Support\Facades\Log::info('ConvertRedirectsToJson: response', [
            'type' => get_class($response),
            'status' => $response->getStatusCode(),
        ]);

        // Si es una redirección y la petición es XHR/espera JSON, devolver JSON con destino
        $isAjax = $request->expectsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest';

        if ($isAjax && $response->getStatusCode() === 302) {
            $target = method_exists($response, 'getTargetUrl') ? $response->getTargetUrl() : 'unknown';
            \Illuminate\Support\Facades\Log::info('ConvertRedirectsToJson: intercepting 302', [
                'target' => $target,
                'status' => $response->getStatusCode(),
            ]);
            return response()->json([
                'success' => false,
                'redirect' => $target,
                'message' => 'Redirect intercepted for AJAX request',
            ], 200); // Return 200 to avoid further redirects
        }

        return $response;
    }
}
