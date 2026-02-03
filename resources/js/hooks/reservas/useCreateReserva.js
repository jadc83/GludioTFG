import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    obtenerTarifas,
    obtenerHabitacionesDisponibles,
    calcularPrecio,
} from './service';
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
    } = useFormGenerico(datosIniciales, '/reservas', '', () => {
        // On success: close modal (delegated to hook state)
        handleCerrar();
    });

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

        calcularPrecio(payload)
            .then((data) => {
                const total = data?.data?.total || 0;
                setPrecioCalculado(total);
                actualizarCampo('precio_total', total);
            })
            .catch((err) => {
                console.error('Error calculando precio:', err);
            });
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
            actualizarCampo('reservable_id', cliente.id);
            actualizarCampo(
                'reservable_type',
                cliente.tipo_usuario === 'user'
                    ? 'App\\Models\\User'
                    : 'App\\Models\\Cliente',
            );
            actualizarCampo('nombre_cliente', cliente.name);
            actualizarCampo('email_cliente', cliente.email);
            actualizarCampo('telefono_cliente', cliente.telefono || '');
            actualizarCampo('tipo_documento', cliente.tipo_documento || 'dni');
            actualizarCampo('numero_documento', cliente.numero_documento || '');
            actualizarCampo('nacionalidad', cliente.nacionalidad || '');
            actualizarCampo('direccion', cliente.direccion || '');
        } else {
            // Limpiar campos cuando se deselecciona
            actualizarCampo('reservable_id', '');
            actualizarCampo('reservable_type', 'cliente');
            actualizarCampo('nombre_cliente', '');
            actualizarCampo('email_cliente', '');
            actualizarCampo('telefono_cliente', '');
            actualizarCampo('tipo_documento', 'dni');
            actualizarCampo('numero_documento', '');
            actualizarCampo('nacionalidad', '');
            actualizarCampo('direccion', '');
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
    const guardarReserva = (e = null) => {
        if (e && e.preventDefault) e.preventDefault();

        const habitacionesConCantidad = Object.entries(habitacionesPorTipo).filter(([_, info]) => info.cantidad > 0);

        if (habitacionesConCantidad.length === 0) {
            alert('Debes seleccionar al menos una habitación');
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
        };

        Object.keys(payload).forEach((key) => {
            if (payload[key] === undefined) delete payload[key];
        });

        setData(payload);
        guardarForm(); // submit via useFormGenerico (post/put)
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
            console.error('Error preparando confirmación:', err);
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
