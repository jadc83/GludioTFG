import { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    obtenerTarifas,
    obtenerHabitacionesDisponibles,
    calcularPrecio,
} from './service';
import { emitToast } from '@/utils/toast';
import * as reservasApi from '@/api/reservas';
import { getReservaPayload } from '@/utils/reservaPayload';
import { useFormGenerico } from '@/hooks/useFormGenerico';

export default function useCreateReserva() {
    const [abierto, setAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('fechas');
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
    const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [habitacionesPorTipo, setHabitacionesPorTipo] = useState({});
    const [precioCalculado, setPrecioCalculado] = useState(0);
    const [tarifas, setTarifas] = useState([]);
    const [tarifasSeleccionadas, setTarifasSeleccionadas] = useState([]);
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);

    const datosIniciales = {
        check_in: '',
        check_out: '',
        reservable_type: 'cliente',
        reservable_id: '',
        nombre_cliente: '',
        email_cliente: '',
        telefono_cliente: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
        habitaciones: [],
        num_huespedes: 1,
        metodo_pago: 'recepcion',
        precio_total: 0,
        tarifas: [],
        notas: '',
    };

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        actualizarCampo,
        setData,
        guardar: guardarForm,
    } = useFormGenerico(datosIniciales, '/reservas', '', (page) => {
        // On success: close modal (delegated to hook state)
        // Default behavior: close modal. If it's a checkout flow, the caller will handle redirect.
        handleCerrar();
    });

    const [creandoConCheckout, setCreandoConCheckout] = useState(false);
    // Ref para debounce de calcular precio
    const calcularTimerRefGlobal = useRef({ current: null });

    const handleCerrar = () => {
        setAbierto(false);
        setHabitacionesDisponibles([]);
        setHabitacionesPorTipo({});
        setPrecioCalculado(0);
        setClienteSeleccionado(null);
        setTabActiva('fechas');
        setTarifasSeleccionadas([]);
        setAceptaTerminos(false);
        setMostrarModalConfirmacion(false);
        setDatosReservaConfirmada(null);
    };

    // Cargar tarifas al abrir
    useEffect(() => {
        if (!abierto) return;

        obtenerTarifas().then((data) => {
            setTarifas(data || []);

            // Seleccionar automáticamente tarifas con valor 0
            const iniciales = (data || [])
                .filter((t) => Number(t.valor ?? t.modificador_precio ?? 0) === 0)
                .map((t) => t.id);

            setTarifasSeleccionadas((prev) => Array.from(new Set([...(prev || []), ...iniciales])));
        });
    }, [abierto]);

    // Buscar habitaciones disponibles cuando cambian las fechas
    useEffect(() => {
        if (!formulario.check_in || !formulario.check_out) {
            setHabitacionesDisponibles([]);
            return;
        }

        // Validar que check_out sea posterior a check_in
        if (new Date(formulario.check_out) <= new Date(formulario.check_in)) {
            setHabitacionesDisponibles([]);
            return;
        }

        setCargandoHabitaciones(true);
        obtenerHabitacionesDisponibles(formulario.check_in, formulario.check_out)
            .then((data) => {
                setHabitacionesDisponibles(data || []);

                // Agrupar por tipo
                const porTipo = {};
                (data || []).forEach((hab) => {
                    if (!porTipo[hab.tipo]) {
                        porTipo[hab.tipo] = {
                            cantidad: 0,
                            disponibles: 0,
                            precio: parseFloat(hab.precio_noche) || 0,
                            habitaciones: [],
                        };
                    }
                    porTipo[hab.tipo].disponibles++;
                    porTipo[hab.tipo].habitaciones.push(hab);
                });
                setHabitacionesPorTipo(porTipo);
            })
            .finally(() => {
                setCargandoHabitaciones(false);
            });
    }, [formulario.check_in, formulario.check_out]);

    // Calcular precio cuando cambian las habitaciones seleccionadas o tarifas
    useEffect(() => {
        const habitacionesConCantidad = Object.entries(habitacionesPorTipo)
            .filter(([_, info]) => info.cantidad > 0)
            .map(([tipo, info]) => ({ tipo, cantidad: info.cantidad }));

        if (!formulario.check_in || !formulario.check_out || habitacionesConCantidad.length === 0) {
            setPrecioCalculado(0);
            actualizarCampo('precio_total', 0);
            return;
        }

        const payload = {
            check_in: formulario.check_in,
            check_out: formulario.check_out,
            habitaciones: habitacionesConCantidad,
            tarifas: tarifasSeleccionadas,
        };

        // Debounce para evitar llamadas duplicadas cuando el usuario ajusta rápidamente la UI
        // Usar Ref en lugar de `this` (hooks functional component)
        const calcularTimerRef = calcularTimerRefGlobal;
        if (calcularTimerRef.current) clearTimeout(calcularTimerRef.current);
        calcularTimerRef.current = setTimeout(() => {
            calcularPrecio(payload)
                .then((data) => {
                    const total = data?.data?.total || 0;
                    setPrecioCalculado(total);
                    actualizarCampo('precio_total', total);
                })
                .catch((err) => {
                    // Error handled by user-facing toast; removed console logging for cleanliness
                    const msg = err?.error || err?.message || err?.response?.data?.error || 'Error calculando precio';
                    emitToast(msg, 'error');
                });
        }, 350);

        return () => {
            if (calcularTimerRef.current) clearTimeout(calcularTimerRef.current);
        };
    }, [habitacionesPorTipo, formulario.check_in, formulario.check_out, tarifasSeleccionadas]);

    // Cambiar cantidad de habitaciones por tipo
    const cambiarCantidadHabitaciones = (tipo, cantidad) => {
        setHabitacionesPorTipo((prev) => ({
            ...prev,
            [tipo]: {
                ...prev[tipo],
                cantidad: Math.max(0, Math.min(cantidad, prev[tipo]?.disponibles ?? 0)),
            },
        }));
    };

    // Toggle tarifa (no toggle para tarifas gratuitas)
    const toggleTarifa = (tarifaId) => {
        const tarifa = tarifas.find((t) => t.id === tarifaId) || {};
        const valor = Number(tarifa.valor ?? tarifa.modificador_precio ?? 0);
        if (valor === 0) return;

        setTarifasSeleccionadas((prev) =>
            prev.includes(tarifaId) ? prev.filter((id) => id !== tarifaId) : [...prev, tarifaId],
        );
    };

    // Objeto de selección para `TarifasSelector` y handler para sincronizar con el array de IDs
    const seleccionObj = Object.fromEntries((tarifas || []).map((t) => [t.id, tarifasSeleccionadas.includes(t.id)]));

    const onTarifasSeleccionChange = (next) => {
        const ids = Object.keys(next).filter((k) => next[k]).map((k) => Number(k));
        setTarifasSeleccionadas(ids);
    };

    const handleSeleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);

            if (cliente) {
            // Actualizar todos los campos de una vez para evitar actualizaciones parciales
            setData({
                ...formulario,
                reservable_id: cliente.id,
                reservable_type: cliente.tipo_usuario === 'user' ? 'App\\Models\\User' : 'App\\Models\\Cliente',
                nombre_cliente: cliente.name || formulario.nombre_cliente,
                email_cliente: cliente.email || formulario.email_cliente,
                telefono_cliente: cliente.telefono || formulario.telefono_cliente,
                tipo_documento: cliente.tipo_documento || formulario.tipo_documento || 'dni',
                numero_documento: cliente.numero_documento || formulario.numero_documento,
                nacionalidad: cliente.nacionalidad || formulario.nacionalidad,
                direccion: cliente.direccion || formulario.direccion,
            });
        } else {
            // Limpiar campos cuando se deselecciona
            setData({
                ...formulario,
                reservable_id: '',
                reservable_type: 'cliente',
                nombre_cliente: '',
                email_cliente: '',
                telefono_cliente: '',
                tipo_documento: 'dni',
                numero_documento: '',
                nacionalidad: '',
                direccion: '',
            });
        }
    };

    const esFormularioCompleto = () => {
        if (!formulario.check_in || !formulario.check_out) return false;
        if (!Object.values(habitacionesPorTipo).some((info) => info.cantidad > 0)) return false;
        if (!formulario.nombre_cliente || !formulario.email_cliente) return false;
        if (!formulario.numero_documento) return false;
        if (!formulario.metodo_pago) return false;
        if (formulario.metodo_pago === 'tarjeta' && !aceptaTerminos) return false;
        return true;
    };

    // Envía la reserva al servidor usando el helper de useFormGenerico
    const [estaGuardando, setEstaGuardando] = useState(false);

    const guardarReserva = async (e = null) => {
        if (e && e.preventDefault) e.preventDefault();

        const habitacionesConCantidad = Object.entries(habitacionesPorTipo).filter(([_, info]) => Number(info.cantidad) > 0);

        if (habitacionesConCantidad.length === 0) {
            setTabActiva('fechas');
            const counts = Object.entries(habitacionesPorTipo).map(([t, i]) => `${t}:${i.cantidad}`).join(', ');
            if (import.meta.env.DEV && counts && counts.length) {
                emitToast(`Debes seleccionar al menos una habitación (actual: ${counts})`, 'error');
            } else {
                emitToast('Debes seleccionar al menos una habitación', 'error');
            }
            return;
        }

        // Construir objeto habitacionesSeleccionadas compatible con getReservaPayload
        const habitacionesSeleccionadas = {};
        habitacionesConCantidad.forEach(([tipo, info]) => {
            habitacionesSeleccionadas[tipo] = { cantidad: info.cantidad, personas: info.personas || 1 };
        });

        // Preparar valores para getReservaPayload
        const getValues = () => ({
            name: formulario.nombre_cliente,
            email: formulario.email_cliente,
            telefono: formulario.telefono_cliente,
            tipo_documento: formulario.tipo_documento || 'dni',
            numero_documento: formulario.numero_documento,
            nacionalidad: formulario.nacionalidad,
            direccion: formulario.direccion,
        });

        const rango = { from: formulario.check_in, to: formulario.check_out };

        // Reutilizar getReservaPayload para normalizar payload
        let payload = getReservaPayload({
            getValues,
            rango,
            habitacionesSeleccionadas,
            tarifasSeleccionadas: tarifasSeleccionadas,
            idClienteSeleccionado: formulario.reservable_id || null,
            tipoClienteSeleccionado: formulario.reservable_type || 'cliente',
        });

        // Añadir campos adicionales requeridos por el formulario/panel
        payload = {
            ...payload,
            precio_total: formulario.precio_total || 0,
            metodo_pago: formulario.metodo_pago || 'recepcion',
            num_huespedes: formulario.num_huespedes || 1,
            notas: formulario.notas || undefined,
        };

        Object.keys(payload).forEach((key) => {
            if (payload[key] === undefined) delete payload[key];
        });

        // Intentar calcular precio si no está presente
        if (!payload.precio_total || payload.precio_total <= 0) {
            try {
                setEstaGuardando(true);
                const precioRes = await calcularPrecio({
                    check_in: payload.check_in,
                    check_out: payload.check_out,
                    habitaciones: Object.entries(habitacionesSeleccionadas).map(([tipo, r]) => ({ tipo, cantidad: r.cantidad })),
                    tarifas: payload.tarifas,
                });

                if (!precioRes || precioRes?.success === false) {
                    const msg = precioRes?.error || precioRes?.message || 'No se pudo calcular el precio';
                    emitToast(msg, 'error');
                    setEstaGuardando(false);
                    return;
                }

                const total = precioRes?.data?.total || precioRes?.data || 0;
                setPrecioCalculado(total);
                actualizarCampo('precio_total', total);
                payload.precio_total = total;
            } catch (err) {
                const msg = err?.error || err?.message || 'Error calculando precio';
                emitToast(msg, 'error');
                setEstaGuardando(false);
                return;
            } finally {
                setEstaGuardando(false);
            }
        }

        try {
            setEstaGuardando(true);

            router.post('/reservas', payload, {
                onSuccess: (resp) => {
                    // Cerrar y recargar para que la UI muestre la nueva reserva
                    try {
                        handleCerrar();
                        router.reload();
                    } catch (e) {
                        window.location.reload();
                    }
                },
                onError: (errors) => {
                    setEstaGuardando(false);
                    if (errors && errors.habitaciones) {
                        setTabActiva('fechas');
                    }
                },
                onFinish: () => {
                    setEstaGuardando(false);
                }
            });
        } catch (err) {
            const msg = err?.message || 'Error creando la reserva';
            emitToast(msg, 'error');
            setEstaGuardando(false);
        }
    };

    // Crea reserva y abre Stripe Checkout en una sola operación (admin)
    const crearReservaConCheckout = async () => {
        const habitacionesConCantidad = Object.entries(habitacionesPorTipo).filter(([_, info]) => info.cantidad > 0);

        if (habitacionesConCantidad.length === 0) {
            emitToast('Debes seleccionar al menos una habitación', 'error');
            return;
        }

        // Si el método de pago es "recepcion", usar el flujo normal (crear reserva sin checkout)
        if ((formulario.metodo_pago || 'recepcion') === 'recepcion') {
            // Reutilizar el guardado normal para crear la reserva
            await guardarReserva();
            return;
        }

        const habitacionesParaReserva = habitacionesConCantidad.map(([tipo, info]) => ({
            tipo,
            cantidad: info.cantidad,
        }));

        const payload = {
            check_in: formulario.check_in,
            check_out: formulario.check_out,
            name: formulario.nombre_cliente || undefined,
            email: formulario.email_cliente || undefined,
            telefono: formulario.telefono_cliente || undefined,
            tipo_documento: formulario.tipo_documento || 'dni',
            numero_documento: formulario.numero_documento || undefined,
            nacionalidad: formulario.nacionalidad || undefined,
            direccion: formulario.direccion || undefined,
            ...(formulario.reservable_id && {
                reservable_type: formulario.reservable_type,
                reservable_id: formulario.reservable_id,
            }),
            habitaciones: habitacionesParaReserva,
            tarifas: tarifasSeleccionadas.length > 0 ? tarifasSeleccionadas : undefined,
            num_huespedes: formulario.num_huespedes || 1,
            metodo_pago: formulario.metodo_pago || 'recepcion',
            notas: formulario.notas || undefined,
            precio_total: formulario.precio_total || 0,
            monto: formulario.precio_total || 0,
        };

        Object.keys(payload).forEach((key) => {
            if (payload[key] === undefined) delete payload[key];
        });

        try {
            setCreandoConCheckout(true);
            const res = await reservasApi.crearReservaConCheckout(payload);

            if (res && res.success && res.sessionUrl) {
                handleCerrar();
                window.location.href = res.sessionUrl;
            } else {
                emitToast(res?.message || res?.error || 'No se pudo iniciar el checkout', 'error');
            }
        } catch (err) {
            // Error handled by user-facing toast; removed console logging for cleanliness
            emitToast('Error iniciando Checkout: ' + (err?.message || ''), 'error');
        } finally {
            setCreandoConCheckout(false);
        }
    };

    const onPagoExitoso = (data) => {
        try {
            const confirm = data?.confirmData || {};
            const localizador = confirm?.localizador || null;
            const cantidad_habitaciones = Object.values(habitacionesPorTipo).reduce((s, info) => s + (info.cantidad || 0), 0);

            const datosConfirmacion = {
                localizador,
                nombre: formulario.nombre_cliente,
                check_in: formulario.check_in,
                check_out: formulario.check_out,
                cantidad_habitaciones,
                precio_total: precioCalculado,
                pagoAlLlegar: false,
            };

            handleCerrar();
            setDatosReservaConfirmada(datosConfirmacion);
            setMostrarModalConfirmacion(true);
        } catch (err) {
            handleCerrar();
            try {
                router.reload({ only: ['reservas'] });
            } catch (e) {
                window.location.reload();
            }
        }
    };

    return {
        abierto,
        setAbierto,
        tabActiva,
        setTabActiva,
        habitacionesDisponibles,
        cargandoHabitaciones,
        clienteSeleccionado,
        setClienteSeleccionado,
        habitacionesPorTipo,
        setHabitacionesPorTipo,
        precioCalculado,
        tarifas,
        tarifasSeleccionadas,
        setTarifasSeleccionadas,
        aceptaTerminos,
        setAceptaTerminos,
        mostrarModalConfirmacion,
        setMostrarModalConfirmacion,
        datosReservaConfirmada,
        setDatosReservaConfirmada,
        formulario,
        cambiar,
        errores,
        estaCargando,
        actualizarCampo,
        setData,
        handleCerrar,
        cambiarCantidadHabitaciones,
        toggleTarifa,
        seleccionObj,
        onTarifasSeleccionChange,
        handleSeleccionarCliente,
        esFormularioCompleto,
        guardarReserva,
        onPagoExitoso,
    };
}
