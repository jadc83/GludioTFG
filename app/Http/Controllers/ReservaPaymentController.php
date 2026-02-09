<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReservaPaymentController extends Controller
{
    public function __construct()
    {
        // Controlador stub para prevenir errores de resolución de clase durante pruebas.
    }

    public function __invoke(Request $request)
    {
        Log::warning('Stub ReservaPaymentController invoked', ['path' => $request->path()]);
        return response()->json(['success' => false, 'message' => 'ReservaPaymentController stub response'], 200);
    }

    public function __call($method, $args)
    {
        try {
            $req = $args[0] ?? null;
            Log::warning('Stub ReservaPaymentController method called', ['method' => $method, 'args' => is_object($req) ? $req->all() : $args]);
        } catch (\Throwable $_) {
            // noop
        }
        return response()->json(['success' => false, 'message' => "ReservaPaymentController stub: method {$method} called"], 200);
    }
}
