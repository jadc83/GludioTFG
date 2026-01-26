<?php

namespace App\Http\Controllers;

use App\Models\Reserva;
use App\Models\RefundRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RefundRequestController extends Controller
{
    public function store(Request $request, Reserva $reserva)
    {
        $validated = $request->validate([
            'monto' => 'nullable|numeric|min:0.01',
            'reason_code' => 'required|string',
            'notes' => 'nullable|string|max:2000',
        ]);

        $user = Auth::user();

        // Verificar que el usuario es propietario de la reserva (reservable) o creador
        $isOwner = false;
        try {
            $isOwner = (
                ($reserva->reservable_type === get_class($user) && $reserva->reservable_id == $user->id)
                || $reserva->user_id == $user->id
                || $reserva->booked_by_user_id == $user->id
            );
        } catch (\Throwable $e) {
            $isOwner = false;
        }

        if (! $isOwner) {
            return response()->json(['success' => false, 'message' => 'No autorizado para solicitar este reembolso.'], 403);
        }

        try {
            $rr = RefundRequest::create([
                'reserva_id' => $reserva->id,
                'pago_id' => null,
                'requested_amount_cents' => isset($validated['monto']) ? intval(round($validated['monto'] * 100)) : null,
                'reason_code' => $validated['reason_code'],
                'notes' => $validated['notes'] ?? null,
                'user_id' => $user->id,
                'status' => 'pending',
            ]);

            // Notificar a admins por correo y broadcast
            try {
                $admins = \App\Models\User::where('is_admin', true)->get();
                if ($admins->isNotEmpty()) {
                    \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\RefundRequestCreatedNotification($rr));
                }
                event(new \App\Events\RefundRequestCreated($rr));
            } catch (\Throwable $e) {
                // No queremos fallar la creación si la notificación falla, solo logueamos
                \Illuminate\Support\Facades\Log::error('Error notificando creación de RefundRequest: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'Solicitud de reembolso creada.', 'refund_request' => $rr], 201);
        } catch (\Throwable $e) {
            Log::error('Error creando RefundRequest: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error creando solicitud de reembolso.'], 500);
        }
    }

    /**
     * Create refund request by reserva localizador (p.ej. GJWQXWR). This resolves the reserva and delegates to store().
     */
    public function storeByLocalizador(Request $request, $localizador)
    {
        $reserva = \App\Models\Reserva::where('localizador', $localizador)->firstOrFail();
        return $this->store($request, $reserva);
    }
}
