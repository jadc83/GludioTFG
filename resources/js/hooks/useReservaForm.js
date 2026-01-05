import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { reservaSchema } from '../utils/reservaSchema';
import useBusquedaCliente from './useBusquedaCliente';
import useHabitaciones from './useHabitaciones';

export default function useReservaForm() {
    const page = usePage();
    const currentUser = page?.props?.auth?.user ?? null;
    const [paso, setPaso] = useState(1);
    const [error, setError] = useState('');
    const [reservableId, setReservableId] = useState(null);
    const [reservableTipo, setReservableTipo] = useState(null);
    const [rango, setRango] = useState({ from: undefined, to: undefined });

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        getValues,
    } = useForm({
        resolver: zodResolver(reservaSchema),
        mode: 'onChange',
        defaultValues: {
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            telefono: currentUser?.telefono || '',
            tipo_documento: 'dni',
            numero_documento: currentUser?.numero_documento || '',
            nacionalidad: currentUser?.nacionalidad || '',
            direccion: currentUser?.direccion || '',
            habitaciones: [],
        },
    });

    // Búsqueda de cliente
    const {
        query,
        setQuery,
        resultados,
        cargando,
        seleccionado,
        seleccionarCliente,
    } = useBusquedaCliente({
        formulario: { setData: (key, value) => setValue(key, value), data: getValues() },
        setReservableId,
        setReservableTipo,
    });

    // Habitaciones
    const {
        availableRooms,
        cargandoHabitaciones,
        habitacionesSeleccionadas,
        getTiposHabitacion,
        getIcono,
        getImagen,
        getTotalHabitaciones,
        actualizarSeleccionHabitacion,
        limpiarRango,
    } = useHabitaciones({ paso, rango, setRango });

    const continuar = () => {
        if (paso === 1 && (!rango?.from || !rango?.to)) {
            setError('Selecciona un rango de fechas.');
            return;
        }

        // Si hay usuario logueado, usar sus datos y pasar a habitaciones
        if (paso === 1 && currentUser) {
            setReservableId(currentUser.id);
            setReservableTipo('usuario');
            setValue('check_in', rango.from);
            setValue('check_out', rango.to);
            setError('');
            setPaso(2); // Ir a habitaciones
            return;
        }

        // Si hay usuario y estamos en habitaciones, saltar directamente a confirmación
        if (paso === 2 && currentUser) {
            setError('');
            setPaso(4); // Ir a confirmación, saltando datos
            return;
        }

        // Flujo normal: Fechas (1) → Habitaciones (2) → Datos (3) → Confirmación (4)
        setError('');
        setPaso(paso + 1);
    };

    const volverAtras = () => {
        if (currentUser && paso === 4) {
            setPaso(2);
            return;
        }
        setPaso(paso - 1);
    };

    const onConfirmar = async () => {
        const values = getValues();
        const habitaciones = Object.entries(habitacionesSeleccionadas)
            .filter(([, r]) => r.cantidad > 0)
            .map(([tipo, r]) => ({
                tipo,
                cantidad: r.cantidad,
                personas_por_habitacion: Number(r.personas) > 0 ? Number(r.personas) : 1,
            }));

        const respuesta = {
            ...values,
            check_in: rango?.from,
            check_out: rango?.to,
            habitaciones,
            reservable_id: reservableId,
            tipo_usuario: reservableTipo,
        };

        if (respuesta.tipo_usuario === 'cliente' && currentUser) {
            respuesta.booked_by_user_id = currentUser.id;
        }

        router.post('/reservas', respuesta, {
            onSuccess: () => {
                try {
                    document.getElementById('drawer-toggle').checked = false;
                } catch (e) {
                    void e;
                }

                setPaso(1);
                setRango({ from: undefined, to: undefined });
                setQuery('');
            },
            onError: (errors) => { setError(
                    errors.message ||
                        Object.values(errors)[0] ||
                        'Error al crear la reserva',
                );
            },
        });
    };

    return {
        register, handleSubmit, errors, watch, setValue, getValues,
        paso, setPaso, continuar, volverAtras, onConfirmar, rango, setRango, limpiarRango,
        query, setQuery, resultados, cargando, seleccionado, seleccionarCliente,
        availableRooms, cargandoHabitaciones, habitacionesSeleccionadas, getTiposHabitacion, getIcono, getImagen, getTotalHabitaciones, actualizarSeleccionHabitacion,
        error, setError, currentUser
    };
}
