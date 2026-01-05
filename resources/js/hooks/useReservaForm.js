import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { reservaSchema } from '../utils/reservaSchema';
import useHabitaciones from './useHabitaciones';
import { calcularPrecioDinamico } from '../utils/precios';

export default function useReservaForm() {
    const page = usePage();
    const usuarioActual = page?.props?.auth?.user ?? null;
    const flashIdReserva = page?.props?.flash?.reserva_id ?? null;
    const flashLocalizador = page?.props?.flash?.localizador ?? null;

    // Estado del asistente
    const [pasoActual, setPasoActual] = useState(1);
    const [mensajeError, setMensajeError] = useState('');

    // Estado de cliente/huésped
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState(null);
    const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState(null);

    // Estado de fechas
    const [rango, setRango] = useState({ from: undefined, to: undefined });

    // Estado de reserva (desde flash props)
    const [idReserva, setIdReserva] = useState(flashIdReserva);
    const [localizador, setLocalizador] = useState(flashLocalizador);

    /**
     * Sincronizar IDs de flash props cuando se actualizan
     */
    useEffect(() => {
        if (flashIdReserva) {
            setIdReserva(flashIdReserva);
        }
        if (flashLocalizador) {
            setLocalizador(flashLocalizador);
        }
    }, [flashIdReserva, flashLocalizador]);

    // React Hook Form - Gestión de formulario con validación Zod
    const {
        register,
        handleSubmit,
        formState: { errors: erroresFormulario },
        watch,
        setValue,
        getValues,
    } = useForm({
        resolver: zodResolver(reservaSchema),
        mode: 'onChange',
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



    // Hook para selección de habitaciones
    const {
        habitacionesDisponibles,
        estaCargandoHabitaciones,
        habitacionesSeleccionadas,
        agruparHabitacionesPorTipo,
        getIcono,
        getImagen,
        getTotalHabitaciones,
        actualizarSeleccionHabitacion,
        limpiarRango,
    } = useHabitaciones({
        paso: pasoActual,
        rango: rango,
        setRango: setRango,
    });

    /**
     * Avanza al siguiente paso con validaciones específicas
     */
    const avanzarPaso = () => {
        if (pasoActual === 1 && (!rango?.from || !rango?.to)) {
            setMensajeError('Selecciona un rango de fechas.');
            return;
        }

        // Si hay usuario logueado y está en paso 1, saltar a paso 2 (habitaciones)
        if (pasoActual === 1 && usuarioActual) {
            setIdClienteSeleccionado(usuarioActual.id);
            setTipoClienteSeleccionado('usuario');
            setMensajeError('');
            setPasoActual(2);
            return;
        }

        // Si hay usuario y está en habitaciones, saltar a confirmación (paso 4)
        if (pasoActual === 2 && usuarioActual) {
            setMensajeError('');
            setPasoActual(4);
            return;
        }

        // Flujo normal: Fechas (1) → Habitaciones (2) → Datos (3) → Confirmación (4)
        setMensajeError('');
        setPasoActual(pasoActual + 1);
    };

    /**
     * Retrocede al paso anterior
     */
    const retrocederPaso = () => {
        if (usuarioActual && pasoActual === 4) {
            setPasoActual(2);
            return;
        }
        setPasoActual(pasoActual - 1);
    };

    /**
     * Calcula el monto total a pagar basado en las habitaciones seleccionadas
     * @returns {number} Monto total en moneda
     */
    const calcularMontoTotal = () => {
        if (!rango?.from || !rango?.to) return 0;

        let montoTotal = 0;

        Object.entries(habitacionesSeleccionadas).forEach(([tipoHabitacion, seleccion]) => {
            if (seleccion.cantidad > 0) {
                // Buscar la habitación en disponibles para obtener precio
                const habitacion = habitacionesDisponibles.find((r) => r.tipo === tipoHabitacion);

                if (habitacion) {
                    const precioDiario = calcularPrecioDinamico(
                        habitacion,
                        rango.from,
                        rango.to,
                    );

                    // Calcular número de noches
                    const milisegundosPorDia = 24 * 60 * 60 * 1000;
                    const numeroNoches = Math.ceil(
                        (rango.to - rango.from) / milisegundosPorDia,
                    );

                    montoTotal +=
                        precioDiario * seleccion.cantidad * numeroNoches;
                }
            }
        });

        return montoTotal;
    };

    /**
     * Envía la reserva al servidor
     */
    const confirmarReserva = async () => {
        const valoresFormulario = getValues();

        // Transformar habitaciones seleccionadas al formato esperado
        const datosHabitacionesSeleccionadas = Object.entries(habitacionesSeleccionadas)
            .filter(([, seleccion]) => seleccion.cantidad > 0)
            .map(([tipoHabitacion, seleccion]) => ({
                tipo: tipoHabitacion,
                cantidad: seleccion.cantidad,
                personas_por_habitacion:
                    Number(seleccion.personas) > 0 ? Number(seleccion.personas) : 1,
            }));

        // Construir objeto de reserva
        const datosReserva = {
            ...valoresFormulario,
            check_in: rango?.from,
            check_out: rango?.to,
            habitaciones: datosHabitacionesSeleccionadas,
            reservable_id: idClienteSeleccionado,
            tipo_usuario: tipoClienteSeleccionado,
        };

        // Si un usuario está reservando para cliente, incluir user_id
        if (
            datosReserva.tipo_usuario === 'cliente' &&
            usuarioActual
        ) {
            datosReserva.booked_by_user_id = usuarioActual.id;
        }

        // Enviar al servidor
        router.post('/reservas', datosReserva, {
            onSuccess: () => {
                manejarExitoReserva();
            },
            onError: (errors) => {
                manejarErrorReserva(errors);
            },
        });
    };

    /**
     * Maneja el éxito de la creación de reserva
     */
    const manejarExitoReserva = () => {
        try {
            const drawerCheckbox = document.getElementById('drawer-toggle');
            if (drawerCheckbox) {
                drawerCheckbox.checked = false;
            }
        } catch (error) {
            console.error('⚠️ Error closing drawer:', error);
        }

        // Resetear estado
        setPasoActual(1);
        setRango({ from: undefined, to: undefined });
        setConsulta('');
    };

    /**
     * Maneja los errores de creación de reserva
     */
    const manejarErrorReserva = (errors) => {
        const msError =
            errors.message ||
            Object.values(errors)[0] ||
            'Error al crear la reserva';
        setMensajeError(msError);
    };

    return {
        // React Hook Form
        register,
        handleSubmit,
        errors: erroresFormulario,
        watch,
        setValue,
        getValues,

        // Estado del asistente
        pasoActual,
        setPasoActual,
        avanzarPaso,
        retrocederPaso,
        mensajeError,
        setMensajeError,

        // Rango de fechas
        rango,
        setRango,
        limpiarRango,

        // Habitaciones disponibles
        habitacionesDisponibles,
        estaCargandoHabitaciones,

        // Habitaciones seleccionadas
        habitacionesSeleccionadas,
        getTotalHabitaciones,
        actualizarSeleccionHabitacion,

        // Métodos de UI
        agruparHabitacionesPorTipo,
        getIcono,
        getImagen,

        // Cálculos
        calcularMontoTotal,

        // Envío de reserva
        confirmarReserva,

        // Info de usuario y reserva
        usuarioActual,
        idReserva,
        localizador,
        idClienteSeleccionado,
        tipoClienteSeleccionado,
    };
}
