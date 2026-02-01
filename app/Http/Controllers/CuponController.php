<?php

namespace App\Http\Controllers;

use App\Models\Cupon;
use App\Models\CuponAplicado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class CuponController extends Controller
{
    /**
     * Validar y aplicar cupón
     */
    public function validar(Request $request)
    {
        $codigo = strtoupper(trim($request->input('codigo', '')));
        $email = Auth::user()?->email ?? $request->input('email', '');
        $precioTotal = (float) $request->input('precio_total', 0);
        $reservaId = $request->input('reserva_id');

        if (!$codigo) {
            return response()->json(['success' => false, 'error' => 'Código vacío']);
        }

        if ($precioTotal < 60) {
            return response()->json(['success' => false, 'error' => 'Mínimo €60 para aplicar cupones']);
        }

        $cacheKey = "cupon_intentos_{$request->ip()}";
        $intentos = Cache::get($cacheKey, 0);
        if ($intentos >= 5) {
            return response()->json(['success' => false, 'error' => 'Demasiados intentos. Intenta en 1 minuto']);
        }
        Cache::put($cacheKey, $intentos + 1, 60);

        $cupon = Cupon::where('codigo', $codigo)->first();
        if (!$cupon) {
            return response()->json(['success' => false, 'error' => 'Código no válido']);
        }

        if (!$cupon->activo) {
            return response()->json(['success' => false, 'error' => 'Cupón inactivo']);
        }


        $ahora = now();
        if ($ahora->isBefore($cupon->fecha_inicio) || $ahora->isAfter($cupon->fecha_fin)) {
            return response()->json(['success' => false, 'error' => 'Cupón expirado']);
        }

        if ($cupon->usos_maximos && $cupon->usos_realizados >= $cupon->usos_maximos) {
            return response()->json(['success' => false, 'error' => 'Cupón agotado']);
        }

        if ($email && $cupon->usos_por_usuario) {
            $usosDelUsuario = CuponAplicado::where('cupon_id', $cupon->id)
                ->where('usuario_email', $email)
                ->count();
            if ($usosDelUsuario >= $cupon->usos_por_usuario) {
                return response()->json(['success' => false, 'error' => "Este cupón ya fue usado {$cupon->usos_por_usuario} veces"]);
            }
        }

        if ($reservaId) {
            $otroCupon = CuponAplicado::where('reserva_id', $reservaId)->exists();
            if ($otroCupon) {
                return response()->json(['success' => false, 'error' => 'Esta reserva ya tiene un cupón aplicado']);
            }
        }

        $descuento = $cupon->tipo === 'porcentaje'
            ? ($precioTotal * $cupon->valor / 100)
            : $cupon->valor;

        $descuento = min($descuento, $precioTotal);

        return response()->json([
            'success' => true,
            'descuento' => (float) number_format($descuento, 2, '.', ''),
            'precio_final' => (float) number_format($precioTotal - $descuento, 2, '.', ''),
            'cupon_id' => $cupon->id,
            'codigo' => $cupon->codigo,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|unique:cupones,codigo|min:3|max:50',
            'tipo' => 'required|in:porcentaje,monto_fijo',
            'valor' => 'required|numeric|min:0.01',
            'usos_maximos' => 'nullable|integer|min:1',
            'usos_por_usuario' => 'nullable|integer|min:1',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'activo' => 'boolean',
            'descripcion' => 'nullable|string|max:255',
        ]);

        Cupon::create([
            ...$validated,
            'codigo' => strtoupper($validated['codigo']),
            'usos_realizados' => 0,
        ]);

        return back()->with('success', 'Cupón creado exitosamente');
    }


    public function update(Request $request, Cupon $cupon)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|unique:cupones,codigo,' . $cupon->id . '|min:3|max:50',
            'tipo' => 'required|in:porcentaje,monto_fijo',
            'valor' => 'required|numeric|min:0.01',
            'usos_maximos' => 'nullable|integer|min:1',
            'usos_por_usuario' => 'nullable|integer|min:1',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'activo' => 'boolean',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $cupon->update([
            ...$validated,
            'codigo' => strtoupper($validated['codigo']),
        ]);

        return back()->with('success', 'Cupón actualizado exitosamente');
    }

    public function destroy(Cupon $cupon)
    {
        if ($cupon->usos_realizados > 0) {
            return back()->with('error', 'No se puede eliminar un cupón que ya ha sido usado');
        }

        $cupon->delete();

        return back()->with('success', 'Cupón eliminado exitosamente');
    }

    public function toggle(Cupon $cupon)
    {
        $cupon->update(['activo' => !$cupon->activo]);

        return back()->with('success', 'Cupón actualizado');
    }
}

