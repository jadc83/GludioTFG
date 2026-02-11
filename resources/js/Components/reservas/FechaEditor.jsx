import { t } from '@/i18n';
import { emitToast } from '@/utils/toast';
import {
    ArrowPathIcon,
    CalendarIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export default function FechaEditor({
    reserva,
    refresh,
    vistaPrevia = null,
    cargandoVistaPrevia = false,
    errorVistaPrevia = null,
    obtenerPreview = null,
    onRequestConfirmDates = null,
    clearPreview = null,
    noWrapper = false,
}) {
    const status = String(reserva?.status || '').toLowerCase();
    const [checkIn, setCheckIn] = useState(reserva.check_in || '');
    const [checkOut, setCheckOut] = useState(reserva.check_out || '');
    const [saving, setSaving] = useState(false);
    const [previewLoaded, setPreviewLoaded] = useState(false);

    const esFechaOriginal = useCallback(
        (ci, co) => ci === reserva?.check_in && co === reserva?.check_out,
        [reserva?.check_in, reserva?.check_out],
    );

    useEffect(() => {
        let mounted = true;
        const tryFetch = async () => {
            if (
                !obtenerPreview ||
                !checkIn ||
                !checkOut ||
                esFechaOriginal(checkIn, checkOut)
            ) {
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
        return () => {
            mounted = false;
        };
    }, [checkIn, checkOut, obtenerPreview, esFechaOriginal, reserva]);

    const onSave = async (e) => {
        e?.preventDefault();
        if (!checkIn || !checkOut)
            return emitToast(t('toasts.fill_both_dates'), 'error');
        if (new Date(checkIn) >= new Date(checkOut))
            return emitToast(t('toasts.checkout_must_be_after'), 'error');

        setSaving(true);
        try {
            if (!esFechaOriginal(checkIn, checkOut)) {
                console.log(
                    '--- [FechaEditor] Solicitud de confirmacion de fechas:',
                    { checkIn, checkOut },
                );
                console.log(
                    '--- [FechaEditor] typeof onRequestConfirmDates:',
                    typeof onRequestConfirmDates,
                );
                if (typeof onRequestConfirmDates === 'function') {
                    try {
                        onRequestConfirmDates(checkIn, checkOut);
                    } catch (err) {
                        console.error(
                            '--- [FechaEditor] onRequestConfirmDates threw:',
                            err,
                        );
                        try {
                            window.dispatchEvent(
                                new CustomEvent(
                                    'debugOnRequestConfirmDatesError',
                                    {
                                        detail: {
                                            error: String(err),
                                            checkIn,
                                            checkOut,
                                        },
                                    },
                                ),
                            );
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    setSaving(false);
                    return;
                } else {
                    console.warn(
                        '--- [FechaEditor] onRequestConfirmDates not provided, dispatching fallback event',
                    );
                    try {
                        window.dispatchEvent(
                            new CustomEvent('showModalFechasFallback', {
                                detail: { checkIn, checkOut },
                            }),
                        );
                    } catch (e) {
                        console.debug(e);
                    }
                    setSaving(false);
                    return;
                }
            }

            const payload = {
                check_in: checkIn,
                check_out: checkOut,
                status: reserva.status || 'pendiente',
                pago: reserva.pago?.estado || 'pendiente',
                habitacion_ids: (reserva.habitaciones || [])
                    .map((h) => Number(h.habitacion_id ?? h.id))
                    .filter((n) => Number.isInteger(n)),
            };

            await axios.put(`/reservas/${reserva.id}`, payload);
            emitToast(t('toasts.dates_updated'), 'success');
            if (refresh) await refresh();
        } catch (err) {
            emitToast(
                err.response?.data?.message || t('toasts.could_not_update'),
                'error',
            );
        } finally {
            setSaving(false);
        }
    };

    const formContent = (
        <form
            onSubmit={onSave}
            role="form"
            aria-label="Editor de fechas"
            className={`${noWrapper ? 'w-full p-0' : 'w-full p-5'}`}
        >
            <div className="flex w-full flex-col gap-4 md:flex-row md:items-end">
                {/* Inputs de Fecha */}
                <div className="grid w-full flex-1 grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {t('edit_reserva.checkin_label')}
                        </label>
                        <div className="relative">
                            <CalendarIcon
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden="true"
                            />
                            <input
                                type="date"
                                aria-label={t('edit_reserva.checkin_label')}
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {t('edit_reserva.checkout_label')}
                        </label>
                        <div className="relative">
                            <CalendarIcon
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden="true"
                            />
                            <input
                                type="date"
                                aria-label={t('edit_reserva.checkout_label')}
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Grupo de Acciones: Limpiar + Guardar */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setCheckIn(reserva?.check_in || '');
                            setCheckOut(reserva?.check_out || '');
                            if (clearPreview) clearPreview();
                        }}
                        className="rounded-lg bg-black p-2.5 text-white transition-all hover:bg-gray-800"
                        title="Restablecer fechas originales"
                        aria-label="Restablecer fechas originales"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>

                    {!esFechaOriginal(checkIn, checkOut) ? (
                        <button
                            type="submit"
                            aria-label={
                                saving
                                    ? t('actions_extra.saving')
                                    : t('actions_extra.update')
                            }
                            disabled={saving}
                            className="flex items-center justify-center gap-2 rounded-lg bg-[#7a0202] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#5f0101] disabled:opacity-50"
                        >
                            {saving ? (
                                <ArrowPathIcon
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <CheckIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                            <span>
                                {saving
                                    ? t('actions_extra.saving')
                                    : t('actions_extra.update')}
                            </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-6 py-2.5 text-sm font-semibold italic text-gray-400"
                        >
                            {t('actions_extra.no_changes')}
                        </button>
                    )}
                </div>
            </div>

            {/* Panel de Vista Previa (Solo aparece si hay cambios) */}
            {(cargandoVistaPrevia || previewLoaded || errorVistaPrevia) && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`mt-5 rounded-lg border p-4 ${errorVistaPrevia ? 'border-red-100 bg-red-50' : 'bg-[#7a0202]/8 border-[#7a0202]/30'}`}
                >
                    {cargandoVistaPrevia ? (
                        <div className="flex items-center gap-3 text-sm font-medium text-[#7a0202]">
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            {t('actions_extra.loading_preview')}
                        </div>
                    ) : errorVistaPrevia ? (
                        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                            <XMarkIcon className="h-5 w-5" />
                            {typeof errorVistaPrevia === 'string'
                                ? errorVistaPrevia
                                : errorVistaPrevia?.message}
                        </div>
                    ) : (
                        vistaPrevia && (
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex gap-8">
                                    {/* Diferencia Monetaria */}
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Incremento en factura
                                        </p>
                                        <p
                                            className={`text-lg font-bold ${Number(vistaPrevia.nuevo_total) > Number(vistaPrevia.viejo_total) ? 'text-amber-600' : 'text-green-600'}`}
                                        >
                                            {Number(vistaPrevia.nuevo_total) >
                                            Number(vistaPrevia.viejo_total)
                                                ? '+'
                                                : ''}
                                            {(
                                                Number(
                                                    vistaPrevia.nuevo_total,
                                                ) -
                                                Number(vistaPrevia.viejo_total)
                                            ).toFixed(2)}
                                            €
                                        </p>
                                    </div>

                                    {/* Noches */}
                                    {(vistaPrevia.extra_nights > 0 ||
                                        vistaPrevia.removed_nights > 0) && (
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                Estancia
                                            </p>
                                            <p className="flex h-7 items-center text-sm font-semibold text-gray-700">
                                                {(() => {
                                                    const extra = Number(
                                                        vistaPrevia.extra_nights ||
                                                            0,
                                                    );
                                                    const removed = Number(
                                                        vistaPrevia.removed_nights ||
                                                            0,
                                                    );
                                                    const count =
                                                        extra > 0
                                                            ? extra
                                                            : removed;
                                                    const sign =
                                                        extra > 0 ? `+` : `-`;
                                                    const label =
                                                        Math.abs(count) === 1
                                                            ? 'noche'
                                                            : 'noches';
                                                    return `${sign}${count} ${label}`;
                                                })()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Badge de Disponibilidad */}
                                <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-tight shadow-sm">
                                    {vistaPrevia.available ? (
                                        <CheckIcon
                                            className="h-6 w-6 text-green-500"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <XMarkIcon
                                            className="h-6 w-6 text-red-500"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </form>
    );

    if (status === 'checked_in' || status === 'checked_out') return null;

    if (noWrapper) return formContent;

    return (
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {formContent}
        </div>
    );
}
