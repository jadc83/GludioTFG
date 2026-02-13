<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Illuminate\Http\Request;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        //
    }

    public function render($request, Throwable $e)
    {
        // If request is Inertia or a normal HTML request (not JSON/ajax), render our JSX error pages
        $isInertia = !is_null($request->header('X-Inertia'));
        $wantsJson = $request->wantsJson() || $request->ajax() || strtolower($request->header('accept') ?? '') === 'application/json';

        if (! $wantsJson) {
            $status = 500;
            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
            }

            // Only handle common statuses and render Blade templates for HTML requests
            if (in_array($status, [403, 404, 500], true)) {
                try {
                    return response()->view('errors.' . $status, ['message' => $e->getMessage() ?: null], $status);
                } catch (\Throwable $inner) {
                    // fallthrough to parent handler
                }
            }
        }

        return parent::render($request, $e);
    }
}
