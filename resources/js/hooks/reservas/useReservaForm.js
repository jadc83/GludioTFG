import { CONFIG_RESERVAS } from '@/utils/constantes';
import { formatearFecha } from '@/utils/fecha';
import { getReservaPayload } from '@/utils/reservaPayload';
import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useHabitaciones from '../habitaciones/useHabitaciones';

// Normaliza tipos enviados al backend según las opciones permitidas en el validador
const NORMAL_ALLOWED = ['doble', 'familiar', 'suite'];
/**
 * Normaliza tipo de habitación a formato estándar
 * Convierte variaciones de texto a tipos permitidos
 * Usado por: procesamiento de datos de formulario
 * Retorna: string normalizado o null si inválido
 */
function normalizeTipo(raw) {
    if (!raw && raw !== 0) return null;
    const s = String(raw).toLowerCase().trim();
    if (s === '') return null;
    if (s.includes('doble')) return 'doble';
    if (s.includes('suite')) return 'suite';
    if (s.includes('familiar') || s.includes('family') || s.includes('familia'))
        return 'familiar';
    if (NORMAL_ALLOWED.includes(s)) return s;
    for (const a of NORMAL_ALLOWED) if (s.indexOf(a) !== -1) return a;
    return null;
}

/**
 * Hook principal para gestión del formulario de reserva
 * Maneja estado del formulario multi-paso, validación, precios y envío
 * Usado por: componentes principales de reserva (BarraReservas, pasos del formulario)
 * Retorna: objeto con estado, funciones y utilidades del formulario
 */
export default function useReservaForm() {
    const { props } = usePage();
    const usuarioActual = props.auth?.user ?? null;
    const flash = props.flash ?? {};

    const [pasoActual, setPasoActual] = useState(1);
    const [mensajeError, setMensajeError] = useState('');
    const [rango, setRango] = useState({ from: undefined, to: undefined });
    const [numHuespedes, setNumHuespedes] = useState(1);

    const [selectedTarifas, setSelectedTarifas] = useState({});
    const [tarifasLookup, setTarifasLookup] = useState({});
    const [ultimoPrecio, setUltimoPrecio] = useState(null);
    const [preciosPorTipo, setPreciosPorTipo] = useState({});

    const [idReserva, setIdReserva] = useState(flash.reserva_id);
    const [localizador, setLocalizador] = useState(flash.localizador);

    // Método público para actualizar tarifas desde componentes
    const actualizarTarifas = useCallback((nuevasTarifas) => {
        console.log('📋 actualizarTarifas:', nuevasTarifas);
        setSelectedTarifas(nuevasTarifas);
    }, []);

    useEffect(() => {
        // track rango changes (no global debug exposure in production)
    }, [rango]);

    useEffect(() => {
        if (flash.reserva_id) setIdReserva(flash.reserva_id);
        if (flash.localizador) setLocalizador(flash.localizador);
    }, [flash.reserva_id, flash.localizador]);

    useEffect(() => {
        const onLista = (e) => {
            const map = {};
            (e?.detail || []).forEach((t) => (map[t.id] = t));
            setTarifasLookup(map);
        };
        window.addEventListener('tarifasLista', onLista);
        return () => {
            window.removeEventListener('tarifasLista', onLista);
        };
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        getValues,
    } = useForm({
        mode: 'onSubmit',
        defaultValues: {
            name: usuarioActual?.name || '',
            email: usuarioActual?.email || '',
            telefono: usuarioActual?.telefono || '',
            tipo_documento: 'dni',
            numero_documento: usuarioActual?.numero_documento || '',
            nacionalidad: usuarioActual?.nacionalidad || '',
            direccion: usuarioActual?.direccion || '',
            habitaciones: [],
        },
    });

    const habitaciones = useHabitaciones({ paso: pasoActual, rango, setRango });

    useEffect(() => {
        if (typeof window !== 'undefined' && habitaciones.recargarDisponibles) {
            window.formularioReservaRef = {
                recargarDisponibles: habitaciones.recargarDisponibles,
            };
        }
        return () => {
            if (window.formularioReservaRef) delete window.formularioReservaRef;
        };
    }, [habitaciones]);

    const avanzarPaso = () => {
        setMensajeError('');
        if (pasoActual === 1 && (!rango?.from || !rango?.to))
            return setMensajeError('Selecciona un rango de fechas.');
        if (pasoActual === 2) {
            const totalSel = habitaciones.getTotalHabitaciones();
            const totalDisp = habitaciones.habitacionesDisponibles.length;
            if (totalSel > CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA)
                return setMensajeError(
                    `Máximo ${CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA} habitaciones.`,
                );
            if (totalSel > totalDisp)
                return setMensajeError(`Solo hay ${totalDisp} disponibles.`);
            if (usuarioActual) {
                try {
                    setValue('name', usuarioActual.name || '');
                    setValue('email', usuarioActual.email || '');
                    setValue('telefono', usuarioActual.telefono || '');
                    setValue(
                        'tipo_documento',
                        usuarioActual.tipo_documento || 'dni',
                    );
                    setValue(
                        'numero_documento',
                        usuarioActual.numero_documento || '',
                    );
                    setValue('nacionalidad', usuarioActual.nacionalidad || '');
                    setValue('direccion', usuarioActual.direccion || '');
                } catch (e) {}
                setPasoActual(4);
                return;
            }
        }
        setPasoActual((prev) => prev + 1);
    };

    const precioSinTarifas = async () => {
        if (!rango?.from || !rango?.to) return 0;
        // Si el rango no es válido (salida no posterior), evitar llamar al servidor y mostrar mensaje
        const checkIn = String(formatearFecha(rango.from));
        const checkOut = String(formatearFecha(rango.to));
        if (!(new Date(checkOut) > new Date(checkIn))) {
            setMensajeError(
                'La fecha de salida debe ser posterior a la fecha de entrada.',
            );
            return 0;
        }

        const habs = Object.entries(habitaciones.habitacionesSeleccionadas)
            .filter(([_, s]) => s.cantidad > 0)
            .map(([tipo, s]) => ({ tipo, cantidad: s.cantidad }));
        if (!habs.length) return 0;
        try {
            const { calcularPrecio } = await import('@/hooks/reservas/service');
            const payload = {
                check_in: checkIn,
                check_out: checkOut,
                habitaciones: habs
                    .map((h) => ({
                        tipo: normalizeTipo(h.tipo),
                        cantidad: Number(h.cantidad || 0),
                    }))
                    .filter(
                        (h) =>
                            h.tipo &&
                            Number.isFinite(h.cantidad) &&
                            Number(h.cantidad) >= 1,
                    ),
                tarifas: Object.keys(selectedTarifas)
                    .filter((k) => selectedTarifas[k])
                    .map(Number),
            };
            const data = await calcularPrecio(payload);
            if (data?.success) setUltimoPrecio(data.data);
            return data?.data || 0;
        } catch (err) {
            // fallback local
            const fallback = { total: 0, habitaciones: [] };
            let total = 0;
            const noches =
                typeof calcularNoches === 'function'
                    ? calcularNoches(rango.from, rango.to) || 1
                    : 1;
            habs.forEach((h) => {
                const tipoInfo =
                    habitaciones.habitacionesPorTipo?.[h.tipo] || {};
                const precioNoche = Number(
                    tipoInfo.precioEntreNoche ??
                        tipoInfo.precioNoche ??
                        tipoInfo.precioTipo ??
                        tipoInfo.precioMinimo ??
                        0,
                );
                const precioTotal =
                    Number(precioNoche) *
                    Number(noches) *
                    Number(h.cantidad || 1);
                total += precioTotal;
                fallback.habitaciones.push({
                    tipo: h.tipo,
                    cantidad: h.cantidad,
                    precioTotal,
                    precioAvg: precioNoche,
                });
            });
            fallback.total = Math.round(total * 100) / 100;
            setUltimoPrecio(fallback);
            return fallback;
        }
    };

    useEffect(() => {
        let mounted = true;
        const calcular = async () => {
            if (!rango?.from || !rango?.to) {
                if (mounted) setPreciosPorTipo({});
                return;
            }
            let habs = Object.entries(habitaciones.habitacionesSeleccionadas)
                .filter(([_, s]) => s.cantidad > 0)
                .map(([tipo, s]) => ({ tipo, cantidad: s.cantidad }));
            if (!habs.length) {
                const tiposDisponibles = Object.keys(
                    habitaciones.habitacionesPorTipo || {},
                );
                habs = tiposDisponibles.map((t) => ({ tipo: t, cantidad: 1 }));
                if (!habs.length) {
                    if (mounted) setPreciosPorTipo({});
                    return;
                }
            }
            try {
                const { calcularPrecio } =
                    await import('@/hooks/reservas/service');
                const checkIn = String(formatearFecha(rango.from));
                const checkOut = String(formatearFecha(rango.to));
                if (!(new Date(checkOut) > new Date(checkIn))) {
                    setMensajeError(
                        'La fecha de salida debe ser posterior a la fecha de entrada.',
                    );
                    setPreciosPorTipo((prev) => {
                        const merged = { ...(prev || {}) };
                        Object.entries(
                            habitaciones.habitacionesPorTipo || {},
                        ).forEach(([t, info]) => {
                            if (merged[t] === undefined)
                                merged[t] = Number(
                                    info.precioEntreNoche ??
                                        info.precioNoche ??
                                        info.precioTipo ??
                                        info.precioMinimo ??
                                        0,
                                );
                        });
                        return merged;
                    });
                    return;
                }
                const payload = {
                    check_in: checkIn,
                    check_out: checkOut,
                    habitaciones: habs
                        .map((h) => ({
                            tipo: normalizeTipo(h.tipo),
                            cantidad: Number(h.cantidad || 0),
                        }))
                        .filter(
                            (h) =>
                                h.tipo &&
                                Number.isFinite(h.cantidad) &&
                                Number(h.cantidad) >= 1,
                        ),
                    tarifas: Object.keys(selectedTarifas)
                        .filter((k) => selectedTarifas[k])
                        .map(Number),
                };

                try {
                    const data = await calcularPrecio(payload);
                    if (mounted) {
                        const baseMap = {};
                        Object.entries(
                            habitaciones.habitacionesPorTipo || {},
                        ).forEach(([t, info]) => {
                            baseMap[t] = Number(
                                info.precioEntreNoche ??
                                    info.precioNoche ??
                                    info.precioTipo ??
                                    info.precioMinimo ??
                                    0,
                            );
                        });
                        setPreciosPorTipo((prev) => {
                            const merged = { ...(prev || {}) };
                            Object.entries(baseMap).forEach(([t, v]) => {
                                if (merged[t] === undefined) merged[t] = v;
                            });
                            if (
                                data &&
                                data.success &&
                                Array.isArray(data.data?.habitaciones)
                            )
                                data.data.habitaciones.forEach((h) => {
                                    if (h.tipo)
                                        merged[h.tipo] = Number(
                                            h.precioAvg ??
                                                h.precio ??
                                                h.precioMinimo ??
                                                merged[h.tipo] ??
                                                0,
                                        );
                                });
                            else if (data && Array.isArray(data.habitaciones))
                                data.habitaciones.forEach((h) => {
                                    if (h.tipo)
                                        merged[h.tipo] = Number(
                                            h.precioAvg ??
                                                h.precio ??
                                                h.precioMinimo ??
                                                merged[h.tipo] ??
                                                0,
                                        );
                                });

                            return merged;
                        });
                    }
                } catch (err) {
                    const status = err?.response?.status;

                    if (status === 422) {
                        const corrected = { ...payload };
                        corrected.habitaciones = (corrected.habitaciones || [])
                            .map((h) => ({
                                tipo: normalizeTipo(h.tipo),
                                cantidad: Number(h.cantidad || 0),
                            }))
                            .filter(
                                (h) =>
                                    h.tipo &&
                                    Number.isFinite(h.cantidad) &&
                                    Number(h.cantidad) >= 1,
                            );

                        try {
                            const data2 = await calcularPrecio(corrected);
                            if (mounted) {
                                const baseMap = {};
                                Object.entries(
                                    habitaciones.habitacionesPorTipo || {},
                                ).forEach(([t, info]) => {
                                    baseMap[t] = Number(
                                        info.precioEntreNoche ??
                                            info.precioNoche ??
                                            info.precioTipo ??
                                            info.precioMinimo ??
                                            0,
                                    );
                                });
                                const map = { ...baseMap };
                                if (
                                    data2 &&
                                    data2.success &&
                                    Array.isArray(data2.data?.habitaciones)
                                )
                                    data2.data.habitaciones.forEach((h) => {
                                        if (h.tipo)
                                            map[h.tipo] = Number(
                                                h.precioAvg ??
                                                    h.precio ??
                                                    h.precioMinimo ??
                                                    map[h.tipo] ??
                                                    0,
                                            );
                                    });
                                else if (
                                    data2 &&
                                    Array.isArray(data2.habitaciones)
                                )
                                    data2.habitaciones.forEach((h) => {
                                        if (h.tipo)
                                            map[h.tipo] = Number(
                                                h.precioAvg ??
                                                    h.precio ??
                                                    h.precioMinimo ??
                                                    map[h.tipo] ??
                                                    0,
                                            );
                                    });
                                setPreciosPorTipo((prev) => {
                                    const merged = { ...(prev || {}) };
                                    Object.entries(baseMap).forEach(
                                        ([t, v]) => {
                                            if (merged[t] === undefined)
                                                merged[t] = v;
                                        },
                                    );

                                    return { ...merged, ...map };
                                });
                            }
                        } catch (err2) {
                            if (mounted) {
                                setPreciosPorTipo((prev) => {
                                    const merged = { ...(prev || {}) };
                                    Object.entries(
                                        habitaciones.habitacionesPorTipo || {},
                                    ).forEach(([t, info]) => {
                                        if (merged[t] === undefined)
                                            merged[t] = Number(
                                                info.precioEntreNoche ??
                                                    info.precioNoche ??
                                                    info.precioTipo ??
                                                    info.precioMinimo ??
                                                    0,
                                            );
                                    });

                                    return merged;
                                });
                            }
                        }
                    } else {
                        if (mounted) {
                            setPreciosPorTipo((prev) => {
                                const merged = { ...(prev || {}) };
                                Object.entries(
                                    habitaciones.habitacionesPorTipo || {},
                                ).forEach(([t, info]) => {
                                    if (merged[t] === undefined)
                                        merged[t] = Number(
                                            info.precioEntreNoche ??
                                                info.precioNoche ??
                                                info.precioTipo ??
                                                info.precioMinimo ??
                                                0,
                                        );
                                });

                                return merged;
                            });
                        }
                    }
                }
            } catch (err) {
                if (mounted) {
                    setPreciosPorTipo((prev) => {
                        const merged = { ...(prev || {}) };
                        Object.entries(
                            habitaciones.habitacionesPorTipo || {},
                        ).forEach(([t, info]) => {
                            if (merged[t] === undefined)
                                merged[t] = Number(
                                    info.precioEntreNoche ??
                                        info.precioNoche ??
                                        info.precioTipo ??
                                        info.precioMinimo ??
                                        0,
                                );
                        });

                        return merged;
                    });
                }
            }
        };
        calcular();
        return () => {
            mounted = false;
        };
    }, [
        rango,
        habitaciones.habitacionesSeleccionadas,
        selectedTarifas,
        habitaciones.habitacionesPorTipo,
    ]);

    const confirmarReserva = () => {
        const payload = getReservaPayload({
            getValues,
            rango,
            habitacionesSeleccionadas: habitaciones.habitacionesSeleccionadas,
            usuarioActual,
            tarifasSeleccionadas: selectedTarifas,
        });
        router.post('/reservas', payload, {
            onSuccess: () => {
                setPasoActual(1);
                habitaciones.limpiarRango();
                const drawer = document.getElementById('drawer-toggle');
                if (drawer) drawer.checked = false;
                router.reload();
            },
            onError: (err) =>
                setMensajeError(
                    err.message || Object.values(err)[0] || 'Error al reservar',
                ),
        });
    };

    return {
        register,
        handleSubmit,
        errors,
        watch,
        setValue,
        getValues,
        pasoActual,
        setPasoActual,
        avanzarPaso,
        retrocederPaso: () => setPasoActual((p) => p - 1),
        mensajeError,
        setMensajeError,
        rango,
        setRango,
        ...habitaciones,
        preciosPorTipo,
        precioSinTarifas,
        ultimoResultadoPrecio: ultimoPrecio,
        confirmarReserva,
        usuarioActual,
        idReserva,
        localizador,
        numHuespedes,
        setNumHuespedes,
        selectedTarifas,
        tarifasLookup,
        actualizarTarifas,
    };
}
