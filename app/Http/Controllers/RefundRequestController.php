<?php

namespace App\Http\Controllers;

use App\Models\Reserva;
use App\Models\RefundRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\PaymentService;
use App\Services\RefundService;
use App\Services\PrecioService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;
use App\Notifications\RefundRequestProcessedNotification;

class RefundRequestController extends Controller
{
    protected RefundService $refundService;

    public function __construct(RefundService $refundService)
    {
        $this->refundService = $refundService;
    }

    /**
     * Create a refund request for a given reserva
     *
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\Reserva $reserva
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, Reserva $reserva)
    {
        Log::info('Incoming RefundRequest store', ['user_id' => Auth::id(), 'localizador' => $reserva->localizador ?? null, 'payload' => $request->all()]);

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

            // Registrar creación para visibilidad en el índice de administración (depuración)
            Log::info('RefundRequest creada', ['id' => $rr->id, 'reserva_id' => $rr->reserva_id, 'user_id' => $rr->user_id, 'requested_amount_cents' => $rr->requested_amount_cents]);

            // Notificar a admins por correo y broadcast
            try {
                $admins = \App\Models\User::all();
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
     *
     * @param \Illuminate\Http\Request $request
     * @param string $localizador
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeByLocalizador(Request $request, $localizador)
    {
        $reserva = \App\Models\Reserva::where('localizador', $localizador)->firstOrFail();
        return $this->store($request, $reserva);
    }

    /**
     * List refund requests (paginated)
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        $list = RefundRequest::with(['reserva', 'user'])->orderByDesc('created_at')->paginate(25);
        return response()->json(['success' => true, 'data' => $list]);
    }

    /**
     * Approve a refund request (admin only)
     *
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\RefundRequest $refundRequest
     * @param \App\Services\PaymentService $paymentService
     * @param \App\Services\PrecioService $precioService
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve(Request $request, RefundRequest $refundRequest, PaymentService $paymentService, PrecioService $precioService)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        // Sólo administradores pueden aprobar solicitudes de reembolso
        if (! Auth::check() || ! (method_exists(Auth::user(), 'hasRole') && Auth::user()->hasRole('admin'))) {
            return response()->json(['success' => false, 'message' => 'Acceso denegado'], 403);
        }

        if ($refundRequest->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Ya procesada.'], 400);
        }

        $amount = $refundRequest->requested_amount_cents ? ($refundRequest->requested_amount_cents / 100) : null;

        // Prefer the pago associated to the refund request if present
        $pagoForRefund = $refundRequest->pago;
        if (! $pagoForRefund) {
            // Try to find the last completed pago
            $pagoForRefund = $refundRequest->reserva->pagos()->where('estado', 'completado')->orderByDesc('pagado_en')->first();
        }
        if (! $pagoForRefund) {
            // Fallback: use any pago that has a stripe_payment_intent_id (last first)
            $pagoForRefund = $refundRequest->reserva->pagos()->whereNotNull('stripe_payment_intent_id')->orderByDesc('id')->first();
        }

        $res = $paymentService->solicitarReembolso(
            $refundRequest->reserva,
            Auth::user() ?? 'system',
            $amount,
            true,
            $pagoForRefund
        );

        if ($res['success']) {
            $refundRequest->update([
                'status' => 'approved',
                'admin_id' => Auth::id() ?? null,
                'admin_reason' => $request->admin_reason ?? null,
                'processed_at' => now(),
                'stripe_refund_id' => $res['refund_id'] ?? null,
                'processed_refund_amount_cents' => $res['refund_amount'] ? intval(round($res['refund_amount'] * 100)) : null,
            ]);

            $reserva = $refundRequest->reserva()->with('reembolsos', 'refundRequests')->first();

            // Sincronizar estados después del reembolso
            if ($reserva) {
                $this->refundService->sincronizarEstadoReservaSegunReembolsos($reserva);
            }

            // Notify the requester that the refund has been processed
            try {
                if ($refundRequest->user) {
                    $refundRequest->user->notify(new RefundRequestProcessedNotification($refundRequest));
                }
            } catch (\Throwable $e) {
                Log::error('Error notifying refund request user after approval: ' . $e->getMessage());
            }

            // Apply pending changes (dates, precios) if present
            try {
                $pendingCheckIn = $refundRequest->pending_check_in;
                $pendingCheckOut = $refundRequest->pending_check_out;
                $pendingNuevoTotal = $refundRequest->pending_nuevo_total;
                if ($pendingCheckIn && $pendingCheckOut) {
                    $checkIn = Carbon::parse($pendingCheckIn)->startOfDay();
                    $checkOut = Carbon::parse($pendingCheckOut)->startOfDay();
                    $reserva = $refundRequest->reserva()->with('habitaciones.habitacion')->first();
                    if ($reserva) {
                        foreach ($reserva->habitaciones as $hr) {
                            $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
                            $precioHabitacion = $precioService->precioEntreFechas($tipo, $checkIn, $checkOut);
                            $hr->update(['precio' => $precioHabitacion, 'check_in' => $checkIn->toDateString(), 'check_out' => $checkOut->toDateString()]);
                        }
                        $reserva->update([
                            'check_in' => $checkIn->toDateString(),
                            'check_out' => $checkOut->toDateString(),
                            'precio_total' => $pendingNuevoTotal ?? $reserva->precio_total,
                        ]);
                        // Sincronizar de nuevo después de cambiar fechas
                        $this->refundService->sincronizarEstadoReservaSegunReembolsos($reserva);
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Error aplicando cambios tras aprobación de RefundRequest: ' . $e->getMessage());
            }

            // Crear PaymentIntent / Pago para el nuevo precio (no confirmar automáticamente)
            try {
                $montoParaCobrar = $refundRequest->pending_nuevo_total ?? ($reserva->precio_total ?? null);
                if ($montoParaCobrar && $montoParaCobrar > 0) {
                    $paymentIntentResult = $paymentService->crearPaymentIntentParaReserva($reserva, (float)$montoParaCobrar);
                    // Adjuntar info del pago al response
                    $res['payment_intent'] = $paymentIntentResult;
                    // Guardar relación con pago si fue creado
                    if (!empty($paymentIntentResult['pago_id'])) {
                        try {
                            $refundRequest->update(['pago_id' => $paymentIntentResult['pago_id']]);
                        } catch (\Throwable $_) {}
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Error creando PaymentIntent tras reembolso: ' . $e->getMessage(), ['refund_request_id' => $refundRequest->id]);
            }
        }

        return response()->json($res);
    }

    /**
     * Reject a refund request (admin only)
     *
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\RefundRequest $refundRequest
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject(Request $request, RefundRequest $refundRequest)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        $request->validate(['admin_reason' => 'required|string']);

        // Sólo administradores pueden rechazar solicitudes de reembolso
        if (! Auth::check() || ! (method_exists(Auth::user(), 'hasRole') && Auth::user()->hasRole('admin'))) {
            return response()->json(['success' => false, 'message' => 'Acceso denegado'], 403);
        }

        $refundRequest->update([
            'status' => 'rejected',
            'admin_id' => Auth::id() ?? null,
            'admin_reason' => $request->admin_reason,
            'processed_at' => now(),
        ]);

        // Sincronizar estado de la reserva (regresa a confirmado si estaba en pendiente)
        $reserva = $refundRequest->reserva()->with('reembolsos', 'refundRequests')->first();
        if ($reserva) {
            $this->refundService->sincronizarEstadoReservaSegunReembolsos($reserva);
        }

        // Notify requester of rejection
        try {
            if ($refundRequest->user) {
                $refundRequest->user->notify(new RefundRequestProcessedNotification($refundRequest));
            }
        } catch (\Throwable $e) {
            Log::error('Error notifying refund request user after rejection: ' . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }

    /**
     * Delete a refund request (admin only)
     *
     * @param \App\Models\RefundRequest $refundRequest
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(RefundRequest $refundRequest)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        // Sólo administradores pueden eliminar solicitudes de reembolso
        if (! Auth::check() || ! (method_exists(Auth::user(), 'hasRole') && Auth::user()->hasRole('admin'))) {
            return response()->json(['success' => false, 'message' => 'Acceso denegado'], 403);
        }

        try {
            $refundRequest->delete();
            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            Log::error('Error borrando RefundRequest: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al eliminar.'], 500);
        }
    }
}
