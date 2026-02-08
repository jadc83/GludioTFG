import { useState, useEffect } from 'react';
import axios from 'axios';
import { emitToast } from '@/utils/toast';

export default function FechaEditor({ reserva, setReserva, refresh, vistaPrevia = null, cargandoVistaPrevia = false, errorVistaPrevia = null, obtenerPreview = null, onRequestConfirmDates = null }) {
    const [checkIn, setCheckIn] = useState(reserva.check_in || '');
    const [checkOut, setCheckOut] = useState(reserva.check_out || '');
    const [saving, setSaving] = useState(false);
    const [previewLoaded, setPreviewLoaded] = useState(false);

    const validate = () => {
        if (!checkIn || !checkOut) {
            emitToast('Rellena ambas fechas', 'error');
            return false;
        }
        if (new Date(checkIn) >= new Date(checkOut)) {
            emitToast('El check-out debe ser posterior al check-in', 'error');
            return false;
        }
        return true;
    };

    // trigger preview when dates change and differ from original
    const esFechaOriginal = (ci, co) => {
        const originalCi = reserva?.check_in || null;
        const originalCo = reserva?.check_out || null;
        return ci === originalCi && co === originalCo;
    };

    useEffect(() => {
        let mounted = true;
        const tryFetch = async () => {
            if (!obtenerPreview) return;
            if (!checkIn || !checkOut) {
                setPreviewLoaded(false);
                return;
            }
            if (esFechaOriginal(checkIn, checkOut)) {
                setPreviewLoaded(false);
                return;
            }
            try {
                setPreviewLoaded(false);
                await obtenerPreview(checkIn, checkOut, reserva);
                if (mounted) setPreviewLoaded(true);
            } catch (e) {
                if (mounted) setPreviewLoaded(false);
            }
        };

        tryFetch();
        return () => { mounted = false; };
    }, [checkIn, checkOut, obtenerPreview, reserva]);

    const onSave = async (e) => {
        e?.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            // If dates differ from original, delegate to confirmation modal flow
            const esOriginal = (ci, co) => {
                const originalCi = reserva?.check_in || null;
                const originalCo = reserva?.check_out || null;
                return ci === originalCi && co === originalCo;
            };

            if (!esOriginal(checkIn, checkOut)) {
                if (typeof onRequestConfirmDates === 'function') {
                    onRequestConfirmDates(checkIn, checkOut);
                    setSaving(false);
                    return;
                }
                // fallback: if no handler provided, proceed with direct update
            }

            const payload = {
                check_in: checkIn,
                check_out: checkOut,
                // Campos requeridos por UpdateReservaRequest: enviar valores actuales para no romper validación
                status: reserva.status || 'pendiente',
                pago: (reserva.pago && reserva.pago.estado) || 'pendiente',
            };

            // Normalizar IDs de habitación a enteros y sólo enviar si hay al menos uno
            const habitacionIdsRaw = (reserva.habitaciones || []).map((h) => h.habitacion_id ?? h.id ?? null);
            const habitacionIds = habitacionIdsRaw
                .map((v) => (v === null || v === undefined ? null : Number(v)))
                .filter((n) => Number.isInteger(n));

            if (habitacionIds.length > 0) payload.habitacion_ids = habitacionIds;

            // Obtener XSRF cookie y pasar como header explícito por si acaso
            const getCookie = (name) => {
                const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                return match ? decodeURIComponent(match[2]) : null;
            };
            const xsrf = getCookie('XSRF-TOKEN');

            const res = await axios.put(`/reservas/${reserva.id}`, payload, {
                withCredentials: true,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                },
            });
            if (res?.data?.success ?? false) {
                emitToast('Fechas actualizadas', 'success');
                if (typeof refresh === 'function') await refresh();
            } else {
                emitToast(res?.data?.message || 'No se pudo actualizar', 'error');
            }
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error actualizando fechas';
            emitToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSave} className="bg-white p-4 rounded shadow-sm">
            <div className="flex gap-3 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in</label>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 block w-40 rounded border-gray-300" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out</label>
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 block w-40 rounded border-gray-300" />
                </div>

                <div>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                        {saving ? 'Guardando...' : 'Guardar fechas'}
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    {cargandoVistaPrevia || (previewLoaded && cargandoVistaPrevia) ? (
                        <div className="text-sm text-gray-500">Calculando cambio de precio...</div>
                    ) : errorVistaPrevia ? (
                        <div className="text-sm text-red-500">{typeof errorVistaPrevia === 'string' ? errorVistaPrevia : (errorVistaPrevia?.message || String(errorVistaPrevia))}</div>
                    ) : (!previewLoaded || !vistaPrevia) ? (
                        <div className="text-sm text-gray-500">Selecciona fechas diferentes para ver la diferencia de precio</div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                {Number(vistaPrevia.nuevo_total) - Number(vistaPrevia.viejo_total) > 0 ? (
                                    <div>
                                        <div className="text-xs text-gray-400">A pagar ahora</div>
                                        <div className="text-lg font-bold text-red-600">+{vistaPrevia.estimate_charge.toFixed ? vistaPrevia.estimate_charge.toFixed(2) : vistaPrevia.estimate_charge}</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-xs text-gray-400">Reembolso estimado</div>
                                        <div className="text-lg font-bold text-green-600">-{vistaPrevia.estimate_refund.toFixed ? vistaPrevia.estimate_refund.toFixed(2) : vistaPrevia.estimate_refund}</div>
                                    </div>
                                )}

                                {/* per-night info */}
                                {vistaPrevia.extra_nights > 0 && (
                                    <div className="mt-2 text-sm text-gray-700">+{Number(vistaPrevia.per_night_change).toFixed(2)} / noche ({vistaPrevia.extra_nights} noche{vistaPrevia.extra_nights > 1 ? 's' : ''})</div>
                                )}
                                {vistaPrevia.removed_nights > 0 && (
                                    <div className="mt-2 text-sm text-gray-700">-{Number(vistaPrevia.per_night_change).toFixed(2)} / noche ({vistaPrevia.removed_nights} noche{vistaPrevia.removed_nights > 1 ? 's' : ''})</div>
                                )}
                            </div>

                            <div className={`text-right ${vistaPrevia.available ? 'text-green-600' : 'text-red-600'}`}>
                                <div className="text-xs font-black uppercase">Estado</div>
                                <div className="font-bold">{vistaPrevia.available ? '✓ Disponible' : '✕ No disponible'}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
