<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RefundRequest;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RefundRequestController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function index(Request $request)
    {
        // Simple list for admin, with filters later
        $list = RefundRequest::with(['reserva', 'user', 'admin'])->orderByDesc('created_at')->paginate(25);

        // Enrich items with processed refund info and type (parcial/completo)
        $list->getCollection()->transform(function ($r) {
            $processed = null;
            if ($r->stripe_refund_id) {
                $processed = \App\Models\Refund::where('stripe_refund_id', $r->stripe_refund_id)->first();
            }
            if (! $processed && $r->pago_id && $r->requested_amount_cents) {
                $processed = \App\Models\Refund::where('pago_id', $r->pago_id)->where('amount_cents', $r->requested_amount_cents)->first();
            }

            $r->processed_refund = $processed ? [
                'amount_cents' => $processed->amount_cents,
                'status' => $processed->status,
            ] : null;

            try {
                $totalPaid = intval(round(\App\Models\Pago::where('reserva_id', $r->reserva_id)->sum('monto') * 100));
            } catch (\Throwable $e) {
                $totalPaid = $r->reserva && isset($r->reserva->precio_total) ? intval(round($r->reserva->precio_total * 100)) : 0;
            }
            $totalRefunded = \App\Models\Refund::where('reserva_id', $r->reserva_id)->sum('amount_cents') ?: 0;

            if ($totalPaid > 0 && $totalRefunded >= $totalPaid) {
                $r->refund_type = 'completo';
            } elseif ($totalRefunded > 0) {
                $r->refund_type = 'parcial';
            } else {
                $r->refund_type = null;
            }

            return $r;
        });

        return response()->json(['success' => true, 'data' => $list]);
    }

    public function approve(Request $request, RefundRequest $refundRequest)
    {
        if ($refundRequest->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'La solicitud ya fue procesada.'], 400);
        }

        $admin = Auth::user();
        $amount = $refundRequest->requested_amount_cents ? ($refundRequest->requested_amount_cents / 100) : null;

        // Ejecutar reembolso mediante PaymentService
        $res = $this->paymentService->solicitarReembolso($refundRequest->reserva, $admin, $amount, true);

        if (!($res['success'] ?? false)) {
            return response()->json(['success' => false, 'message' => $res['message'] ?? 'Error al procesar reembolso.'], 400);
        }

        // actualizar solicitud
        $refundRequest->update([
            'status' => 'approved',
            'admin_id' => $admin?->id ?? null,
            'admin_reason' => $request->input('admin_reason') ?? null,
            'processed_at' => now(),
            'stripe_refund_id' => $res['refund_id'] ?? null,
        ]);

        // Notificar cliente y broadcast del procesamiento
        try {
            if ($refundRequest->user) {
                $refundRequest->user->notify(new \App\Notifications\RefundRequestProcessedNotification($refundRequest));
            }
            event(new \App\Events\RefundRequestProcessed($refundRequest));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error notificando aprobación de RefundRequest: ' . $e->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'Solicitud aprobada y reembolso ejecutado.', 'refund' => $res]);
    }

    public function reject(Request $request, RefundRequest $refundRequest)
    {
        if ($refundRequest->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'La solicitud ya fue procesada.'], 400);
        }

        $admin = Auth::user();
        $reason = $request->validate(['admin_reason' => 'required|string']);

        $refundRequest->update([
            'status' => 'rejected',
            'admin_id' => $admin?->id ?? null,
            'admin_reason' => $reason['admin_reason'],
            'processed_at' => now(),
        ]);

        // Notificar cliente y broadcast del rechazo
        try {
            if ($refundRequest->user) {
                $refundRequest->user->notify(new \App\Notifications\RefundRequestProcessedNotification($refundRequest));
            }
            event(new \App\Events\RefundRequestProcessed($refundRequest));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error notificando rechazo de RefundRequest: ' . $e->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'Solicitud rechazada.']);
    }

    /**
     * Remove the specified refund request (admin only). Only pending requests may be deleted.
     */
    public function destroy(Request $request, RefundRequest $refundRequest)
    {
        $admin = Auth::user();

        if ($refundRequest->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Solo se pueden borrar solicitudes pendientes.'], 400);
        }

        try {
            // Mark as deleted for auditability
            $refundRequest->update([
                'status' => 'deleted',
                'admin_id' => $admin?->id ?? null,
                'admin_reason' => $request->input('admin_reason') ?? null,
                'processed_at' => now(),
            ]);

            // Notify requester and broadcast to admins to refresh
            try {
                if ($refundRequest->user) {
                    $refundRequest->user->notify(new \App\Notifications\RefundRequestProcessedNotification($refundRequest));
                }
                event(new \App\Events\RefundRequestProcessed($refundRequest));
                event(new \App\Events\RefundRequestCreated($refundRequest)); // also trigger admin list refresh if needed
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Error notificando borrado de RefundRequest: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'Solicitud eliminada.']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error borrando RefundRequest: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al borrar solicitud.'], 500);
        }
    }
}
