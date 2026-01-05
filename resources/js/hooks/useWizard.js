import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { formatearFecha } from '../utils/fecha';

export default function useWizard({
    currentUser,
    rango,
    setRango,
    habitacionesSeleccionadas,
    resetSeleccion,
    reservableId,
    reservableTipo,
    setReservableId,
    setReservableTipo,
    setError,
    setQuery,
    setModoNuevo,
    formulario,
}) {
    const [paso, setPaso] = useState(1);

    const continuar = () => {
        if (paso === 1 && (!rango?.from || !rango?.to))
            return setError('Selecciona un rango de fechas.');
        setError('');

        if (paso === 1 && currentUser) {
            setReservableId(currentUser.id);
            setReservableTipo('usuario');
            try {
                formulario.setData('name', currentUser.name || formulario.data.name);
                formulario.setData('email', currentUser.email || formulario.data.email);
                formulario.setData(
                    'telefono',
                    currentUser.telefono || formulario.data.telefono || '',
                );
                formulario.setData(
                    'tipo_documento',
                    currentUser.tipo_documento || formulario.data.tipo_documento,
                );
                formulario.setData(
                    'numero_documento',
                    currentUser.numero_documento ||
                        formulario.data.numero_documento ||
                        '',
                );
                formulario.setData(
                    'nacionalidad',
                    currentUser.nacionalidad ||
                        formulario.data.nacionalidad ||
                        '',
                );
                formulario.setData(
                    'direccion',
                    currentUser.direccion || formulario.data.direccion || '',
                );
            } catch (e) {
                void e;
            }
            setPaso(3);
            return;
        }
        setPaso(paso + 1);
    };

    const volverAtras = () => {
        if (currentUser && paso === 3) {
            setPaso(1);
            return;
        }
        setPaso(paso - 1);
    };

    const siguiente = () => {
        if (reservableId && reservableTipo) {
        } else {
            setReservableId(null);
            setReservableTipo(null);
        }
        continuar();
    };

    const onConfirmar = () => {
        const check_in = rango?.from ? formatearFecha(rango.from) : null;
        const check_out = rango?.to ? formatearFecha(rango.to) : null;

        formulario.setData('check_in', check_in);
        formulario.setData('check_out', check_out);

        if (reservableId && reservableTipo) {
            formulario.setData('reservable_id', reservableId);
            formulario.setData('tipo_usuario', reservableTipo);
        }

        if (Object.keys(habitacionesSeleccionadas).length > 0) {
            const habitaciones = Object.entries(habitacionesSeleccionadas)
                .filter(([, r]) => r.cantidad > 0)
                .map(([tipo, r]) => ({
                    tipo,
                    cantidad: r.cantidad,
                    personas_por_habitacion:
                        Number(r.personas) > 0 ? Number(r.personas) : 1,
                }));
            formulario.setData('habitaciones', habitaciones);
        }

        const respuesta = {
            ...formulario.data,
            check_in,
            check_out,
        };

        if (reservableId && reservableTipo) {
            respuesta.reservable_id = reservableId;
            respuesta.tipo_usuario = reservableTipo;
        }

        if (Object.keys(habitacionesSeleccionadas).length > 0) {
            respuesta.habitaciones = Object.entries(habitacionesSeleccionadas)
                .filter(([, r]) => r.cantidad > 0)
                .map(([tipo, r]) => ({
                    tipo,
                    cantidad: r.cantidad,
                    personas_por_habitacion: Number(r.personas) > 0 ? Number(r.personas) : 1,
                }));
        }

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

                try {
                    if (typeof formulario.reset === 'function')
                        formulario.reset();
                } catch (e) {
                    void e;
                }

                setPaso(1);
                setRango({ from: undefined, to: undefined });
                resetSeleccion();
                setReservableId(null);
                setReservableTipo(null);
                setModoNuevo(true);
                setQuery('');
            },
            onError: (errors) => {
                try {
                    if (typeof formulario.setErrors === 'function') {
                        formulario.setErrors(errors || {});
                    } else if (typeof formulario.setError === 'function') {
                        formulario.setError(errors || {});
                    } else {
                        setError( errors.message || Object.values(errors)[0] || 'Error al crear la reserva');
                    }
                } catch (e) {
                    setError('Error al crear la reserva');
                }
            },
        });
    };

    return { paso, setPaso, continuar, volverAtras, siguiente, onConfirmar };
}
