import * as api from '@/api/reservas';
import { calcularPrecio } from '@/hooks/reservas/service';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';

export default function usePreview() {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPreview = useCallback(
        async (checkInStr, checkOutStr, reserva = null) => {
            try {
                setError(null);
                setLoading(true);

                // Use server-side preview if available; otherwise compute from disponibilidad
                const disponibles = await api.getDisponibles(
                    checkInStr,
                    checkOutStr,
                    reserva?.id || reserva?.reserva_id || null,
                );

                if (!disponibles) {
                    setPreview(null);
                    setError('No se pudo calcular disponibilidad');
                    return null;
                }

                // calcular nuevo total basándonos en los tipos de habitaciones de la reserva
                let nuevoTotal = 0;
                let disponible = true;

                const grupos = Array.isArray(disponibles) ? disponibles : [];

                const habitaciones = reserva?.habitaciones || [];

                const nightsOld =
                    reserva?.check_in && reserva?.check_out
                        ? dayjs(reserva.check_out).diff(
                              dayjs(reserva.check_in),
                              'day',
                          )
                        : 0;
                const nightsNew = dayjs(checkOutStr).diff(
                    dayjs(checkInStr),
                    'day',
                );
                const viejoTotal = Number(reserva?.precio_total ?? 0);

                // Start from assigned totals (hr.precio are stored as total for that assignment)
                let baseAssignedTotal = 0;
                for (const hr of habitaciones) {
                    baseAssignedTotal += Number(hr.precio ?? 0);
                }

                // Totales calculados para rangos extra/removidos (guardados para cálculo por-noche)
                let lastExtraTotal = 0;
                let lastRemovedTotal = 0;

                // If no habitaciones assigned, fall back to backend grupos full price
                if (habitaciones.length === 0) {
                    // sum grupo.precioTotal for the full nightsNew
                    for (const g of grupos) {
                        nuevoTotal += Number(
                            g.precioTotal ?? g.precio_total ?? 0,
                        );
                    }
                } else {
                    // Start from the current reservation total — avoids mismatches between slot totals and reserva.precio_total
                    nuevoTotal = viejoTotal;

                    const extraNights = Math.max(0, nightsNew - nightsOld);
                    const removedNights = Math.max(0, nightsOld - nightsNew);

                    // Add cost for extra nights using backend calcularPrecio (precios reales por día)
                    if (extraNights > 0) {
                        try {
                            const tipoCounts = {};
                            for (const hr of habitaciones) {
                                const tipo =
                                    hr.tipo || hr.tipo_habitacion || null;
                                if (!tipo) continue;
                                tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1;
                            }

                            const habPayload = Object.entries(tipoCounts).map(
                                ([tipo, cantidad]) => ({ tipo, cantidad }),
                            );
                            // Determine whether extra nights are before the original check_in or after the original check_out
                            let extraCheckIn;
                            let extraCheckOut;
                            if (
                                dayjs(checkInStr).isBefore(
                                    dayjs(reserva.check_in),
                                )
                            ) {
                                // Extra nights added at the beginning
                                extraCheckIn = checkInStr;
                                extraCheckOut = reserva.check_in;
                            } else {
                                // Extra nights added at the end
                                extraCheckIn = reserva.check_out;
                                extraCheckOut = checkOutStr;
                            }

                            const payload = {
                                check_in: extraCheckIn,
                                check_out: extraCheckOut,
                                habitaciones: habPayload,
                                tarifas:
                                    reserva?.tarifa_ids ||
                                    (reserva?.tarifas
                                        ? reserva.tarifas.map((t) => t.id)
                                        : []) ||
                                    [],
                                reserva_id:
                                    reserva?.id || reserva?.reserva_id || null,
                            };

                            const precioRes = await calcularPrecio(payload);
                            if (!precioRes || !precioRes.success) {
                                disponible = false;
                            } else {
                                const extraTotal = Number(
                                    precioRes.data?.total ??
                                        precioRes.data?.precio_total ??
                                        0,
                                );
                                lastExtraTotal = extraTotal;
                                nuevoTotal += extraTotal;
                            }
                        } catch (e) {
                            disponible = false;
                        }
                    }

                    // Subtract cost for removed nights using assignment per-night when available, else group per-night
                    if (removedNights > 0) {
                        try {
                            // Si la reserva tiene habitaciones asignadas con precio por noche,
                            // usar ese `precio_noche` por habitación para calcular el total a restar
                            // (evita usar la "media" de la reserva).
                            let usedFallback = false;
                            if (
                                Array.isArray(habitaciones) &&
                                habitaciones.length > 0
                            ) {
                                let removedSum = 0;
                                let ok = true;
                                for (const hr of habitaciones) {
                                    const precioNoche = Number(
                                        hr.precio_noche ??
                                            (hr.precio
                                                ? Number(hr.precio) /
                                                  Math.max(1, nightsOld)
                                                : NaN),
                                    );
                                    if (
                                        !Number.isFinite(precioNoche) ||
                                        Number.isNaN(precioNoche)
                                    ) {
                                        ok = false;
                                        break;
                                    }
                                    removedSum += precioNoche * removedNights;
                                }

                                if (ok) {
                                    lastRemovedTotal =
                                        Math.round(removedSum * 100) / 100;
                                    nuevoTotal -= lastRemovedTotal;
                                } else {
                                    usedFallback = true;
                                }
                            } else {
                                usedFallback = true;
                            }

                            if (usedFallback) {
                                // calcular reembolso por las noches que se quitan consultando al backend
                                const tipoCounts = {};
                                for (const hr of habitaciones) {
                                    const tipo =
                                        hr.tipo || hr.tipo_habitacion || null;
                                    if (!tipo) continue;
                                    tipoCounts[tipo] =
                                        (tipoCounts[tipo] || 0) + 1;
                                }

                                const habPayload = Object.entries(
                                    tipoCounts,
                                ).map(([tipo, cantidad]) => ({
                                    tipo,
                                    cantidad,
                                }));
                                // Determine removed range: could be at the end or at the beginning
                                let removedCheckIn;
                                let removedCheckOut;
                                if (
                                    dayjs(checkOutStr).isBefore(
                                        dayjs(reserva.check_out),
                                    )
                                ) {
                                    // Removed nights at the end
                                    removedCheckIn = checkOutStr;
                                    removedCheckOut = reserva.check_out;
                                } else {
                                    // Removed nights at the beginning
                                    removedCheckIn = reserva.check_in;
                                    removedCheckOut = checkInStr;
                                }

                                const payload = {
                                    check_in: removedCheckIn,
                                    check_out: removedCheckOut,
                                    habitaciones: habPayload,
                                    tarifas:
                                        reserva?.tarifa_ids ||
                                        (reserva?.tarifas
                                            ? reserva.tarifas.map((t) => t.id)
                                            : []) ||
                                        [],
                                    reserva_id:
                                        reserva?.id ||
                                        reserva?.reserva_id ||
                                        null,
                                };

                                const precioRes = await calcularPrecio(payload);
                                if (!precioRes || !precioRes.success) {
                                    disponible = false;
                                } else {
                                    const removedTotal = Number(
                                        precioRes.data?.total ??
                                            precioRes.data?.precio_total ??
                                            0,
                                    );
                                    lastRemovedTotal = removedTotal;
                                    nuevoTotal -= removedTotal;
                                }
                            }
                        } catch (e) {
                            disponible = false;
                        }
                    }
                }

                const delta = Number(nuevoTotal) - Number(viejoTotal);
                const penalizacion = 20.0;
                let estimateRefund = 0.0;
                let estimateRefundRaw = 0.0;
                let estimateCharge = 0.0;
                if (delta < 0) {
                    const rawRefund =
                        Math.round((viejoTotal - nuevoTotal) * 100) / 100;
                    estimateRefundRaw = rawRefund;
                    estimateRefund = Math.max(
                        0,
                        Math.round((rawRefund - penalizacion) * 100) / 100,
                    );
                } else {
                    estimateCharge = Math.round(delta * 100) / 100;
                }

                // diferencia por noche (según días añadidos/quitados)
                const extraNights = Math.max(0, nightsNew - nightsOld);
                const removedNights = Math.max(0, nightsOld - nightsNew);
                let perNightChange = 0;
                let perNightLabel = '';
                let perNightNet = 0;

                if (extraNights > 0) {
                    // Use the exact total computed for the extra range and derive per-night value
                    const perNightVal =
                        extraNights > 0
                            ? Math.round((lastExtraTotal / extraNights) * 100) /
                              100
                            : 0;
                    perNightChange = perNightVal;
                    perNightLabel = '+';
                    perNightNet = perNightChange;
                } else if (removedNights > 0) {
                    const perNightVal =
                        removedNights > 0
                            ? Math.round(
                                  (lastRemovedTotal / removedNights) * 100,
                              ) / 100
                            : 0;
                    perNightChange = perNightVal;
                    perNightLabel = '-';
                    const penalPerNight =
                        removedNights > 0
                            ? Math.round((penalizacion / removedNights) * 100) /
                              100
                            : 0;
                    perNightNet = Math.max(
                        0,
                        Math.round((perNightChange - penalPerNight) * 100) /
                            100,
                    );
                }

                const result = {
                    success: true,
                    available: disponible,
                    nuevo_total: Math.round(nuevoTotal * 100) / 100,
                    viejo_total: Math.round(viejoTotal * 100) / 100,
                    nights_old: nightsOld,
                    nights_new: nightsNew,
                    estimate_refund: estimateRefund,
                    estimate_refund_raw: estimateRefundRaw,
                    penalizacion: penalizacion,
                    estimate_charge: estimateCharge,
                    extra_nights: extraNights,
                    removed_nights: removedNights,
                    per_night_change: perNightChange,
                    per_night_label: perNightLabel,
                    per_night_net: perNightNet,
                };

                // Debug logging to help trace unexpected small deltas in UI
                try {
                    // eslint-disable-next-line no-console
                    console.debug('[usePreview] debug', {
                        viejoTotal,
                        nuevoTotal,
                        nightsOld,
                        nightsNew,
                        baseAssignedTotal,
                        grupos,
                    });
                } catch (e) {
                    console.debug(e);
                }

                setPreview(result);
                return result;
            } catch (err) {
                setPreview(null);
                setError(err?.message || String(err));
                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const clearPreview = useCallback(() => {
        setPreview(null);
        setError(null);
    }, []);

    return { preview, loading, error, fetchPreview, clearPreview };
}
