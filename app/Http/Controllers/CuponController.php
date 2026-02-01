<?php

namespace App\Http\Controllers;

use App\Models\Cupon;
use App\Models\CuponAplicado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CuponController extends Controller
{
    /**
     * Validar y aplicar cupón
     */
    public function validar(Request $request)
    {
        $codigo = strtoupper(trim($request->input('codigo', '')));
        $email = auth()->user()?->email ?? $request->input('email', '');
        $precioTotal = (float) $request->input('precio_total', 0);

        if (!$codigo) {
            return response()->json(['success' => false, 'error' => 'Código vacío']);
        }

        // Rate limiting: máx 5 intentos por IP por minuto
        $cacheKey = "cupon_intentos_{$request->ip()}";
        $intentos = Cache::get($cacheKey, 0);
        if ($intentos >= 5) {
            return response()->json(['success' => false, 'error' => 'Demasiados intentos. Intenta en 1 minuto']);
        }
        Cache::put($cacheKey, $intentos + 1, 60);

        // 1. Validar que existe
        $cupon = Cupon::where('codigo', $codigo)->first();
        if (!$cupon) {
            return response()->json(['success' => false, 'error' => 'Código no válido']);
        }

        // 2. Validar que está activo
        if (!$cupon->activo) {
            return response()->json(['success' => false, 'error' => 'Cupón inactivo']);
        }

        // 3. Validar fecha
        $ahora = now();
        if ($ahora->before($cupon->fecha_inicio) || $ahora->after($cupon->fecha_fin)) {
            return response()->json(['success' => false, 'error' => 'Cupón expirado']);
        }

        // 4. Validar usos máximos
        if ($cupon->usos_maximos && $cupon->usos_realizados >= $cupon->usos_maximos) {
            return response()->json(['success' => false, 'error' => 'Cupón agotado']);
        }

        // 5. Validar usos por usuario (solo si está autenticado)
        if ($email) {
            $yaUsado = CuponAplicado::where('cupon_id', $cupon->id)
                ->where('usuario_email', $email)
                ->exists();
            if ($yaUsado) {
                return response()->json(['success' => false, 'error' => 'Ya usaste este cupón']);
            }
        }

        // Calcular descuento
        $descuento = $cupon->tipo === 'porcentaje'
            ? ($precioTotal * $cupon->valor / 100)
            : $cupon->valor;

        // No permitir descuento negativo
        $descuento = min($descuento, $precioTotal);

        return response()->json([
            'success' => true,
            'descuento' => (float) number_format($descuento, 2, '.', ''),
            'precio_final' => (float) number_format($precioTotal - $descuento, 2, '.', ''),
            'cupon_id' => $cupon->id,
            'codigo' => $cupon->codigo,
        ]);
    }
}
