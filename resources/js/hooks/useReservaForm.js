import { useForm } from 'react-hook-form';
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import useHabitaciones from './useHabitaciones';

export default function useReservaForm() {
    const page = usePage();
    const usuarioActual = page?.props?.auth?.user ?? null;
    const csrfToken = page?.props?.csrf_token ?? '';
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



    // Hook para selección de habitaciones
    const {
        habitacionesDisponibles,
        estaCargandoHabitaciones,
        habitacionesSeleccionadas,
        agruparHabitacionesPorTipo,
        getIcono,
        getImagen,
        getTotalHabitaciones,
        getTotalDisponibles,
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

        // Validar límite máximo de habitaciones en paso 2
        if (pasoActual === 2) {
            const totalHabitaciones = getTotalHabitaciones();
            const totalDisponibles = habitacionesDisponibles.length;

            if (totalHabitaciones > CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA) {
                setMensajeError(`No puedes reservar más de ${CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA} habitaciones por reserva.`);
                return;
            }

            if (totalHabitaciones > totalDisponibles) {
                setMensajeError(`No puedes reservar más de ${totalDisponibles} habitaciones disponibles.`);
                return;
            }
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
     */
    const calcularMontoTotal = async () => {
        if (!rango?.from || !rango?.to) return 0;

        // Preparar datos para enviar al servidor
        const habitacionesArray = Object.entries(habitacionesSeleccionadas)
            .filter(([_, seleccion]) => seleccion.cantidad > 0)
            .map(([tipo, seleccion]) => ({
                tipo: tipo,
                cantidad: seleccion.cantidad,
            }));

        if (habitacionesArray.length === 0) return 0;

        try {
            // Formatear fechas en zona horaria local (evitar cambios por UTC)
            const formatearFechaLocal = (fecha) => {
                const year = fecha.getFullYear();
                const month = String(fecha.getMonth() + 1).padStart(2, '0');
                const day = String(fecha.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const payload = {
                check_in: formatearFechaLocal(rango.from),
                check_out: formatearFechaLocal(rango.to),
                habitaciones: habitacionesArray,
            };

            const response = await fetch('/reservas/calcular-precio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                console.error('Error HTTP al calcular precio:', response.statusText);
                return 0;
            }

            const data = await response.json();

            if (data.success && data.data) {
                // Devolver el objeto completo con detalles
                return data.data;
            } else {
                console.error('Error en respuesta de precio:', data.error);
                return 0;
            }
        } catch (error) {
            console.error('Error en calcularMontoTotal:', error);
            return 0;
        }
    };

    /**
     * ✅ AHORA EN BACKEND: La creación de reserva está en ReservaService
     * El frontend solo prepara datos básicos y deja la transformación al servidor
     * Esta función se mantiene para referencia de flujo UI
     */
    const confirmarReserva = async () => {
        // El servidor ahora maneja toda la validación y transformación
        // Solo recibimos el estado final de la reserva
        const valoresFormulario = getValues();

        const datosReserva = {
            name: valoresFormulario.name,
            email: valoresFormulario.email,
            telefono: valoresFormulario.telefono,
            tipo_documento: valoresFormulario.tipo_documento,
            numero_documento: valoresFormulario.numero_documento,
            nacionalidad: valoresFormulario.nacionalidad,
            direccion: valoresFormulario.direccion,
            check_in: rango?.from,
            check_out: rango?.to,
            habitaciones: Object.entries(habitacionesSeleccionadas)
                .filter(([, seleccion]) => seleccion.cantidad > 0)
                .map(([tipoHabitacion, seleccion]) => ({
                    tipo: tipoHabitacion,
                    cantidad: seleccion.cantidad,
                    personas_por_habitacion: Number(seleccion.personas) > 0 ? Number(seleccion.personas) : 1,
                })),
            reservable_id: idClienteSeleccionado,
            tipo_usuario: tipoClienteSeleccionado,
            booked_by_user_id: usuarioActual?.id || null,
        };

        router.post('/reservas', datosReserva, {
            onSuccess: () => {
                // Resetear estado
                setPasoActual(1);
                setRango({ from: undefined, to: undefined });
                setMensajeError('');

                // Cerrar drawer si existe
                try {
                    const drawerCheckbox = document.getElementById('drawer-toggle');
                    if (drawerCheckbox) {
                        drawerCheckbox.checked = false;
                    }
                } catch (error) {
                    console.error('⚠️ Error closing drawer:', error);
                }

                // Recargar la página para refrescar los datos (especialmente habitaciones en panel)
                router.reload();
            },
            onError: (errors) => {
                const msError = errors.message || Object.values(errors)[0] || 'Error al crear la reserva';
                setMensajeError(msError);
            },
        });
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
        getTotalDisponibles,
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
