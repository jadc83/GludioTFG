import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import useBusquedaCliente from './useBusquedaCliente';
import useHabitaciones from './useHabitaciones';
import useWizard from './useWizard';

export default function useMenuLateralForm() {
    const page = usePage();
    const currentUser = page?.props?.auth?.user ?? null;

    // Estados simples
    const [error, setError] = useState('');
    const [modoNuevo, setModoNuevo] = useState(true);
    const [reservaNoEsParaMi, setReservaNoEsParaMi] = useState(
        currentUser ? false : true,
    );
    const [reservableId, setReservableId] = useState(null);
    const [reservableTipo, setReservableTipo] = useState(null);

    const formulario = useForm({
        name: '',
        email: '',
        telefono: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
    });

    // Hooks secundarios
    const [rango, setRango] = useState({ from: undefined, to: undefined });

    const { query, setQuery, resultados, cargando, seleccionado, seleccionarCliente } =
        useBusquedaCliente({
            modoNuevo,
            reservaNoEsParaMi,
            formulario,
            setReservableId,
            setReservableTipo,
        });

    const {
        availableRooms,
        cargandoHabitaciones,
        habitacionesSeleccionadas,
        getTiposHabitacion,
        getIcono,
        getImagen,
        getTotalHabitaciones,
        actualizarSeleccionHabitacion,
        eliminarTipoHabitacion,
        resetSeleccion,
        limpiarRango,
    } = useHabitaciones({ paso: 0, rango, setRango });

    const { paso, setPaso, continuar, volverAtras, siguiente, onConfirmar } =
        useWizard({ currentUser,
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
                    formulario });

    // Auto-limpieza de errores
    useEffect(() => {
        if (!error) return;
        const tiempo = setTimeout(() => setError(''), 5000);
        return () => clearTimeout(tiempo);
    }, [error]);

    // Helper
    const cambioCampo = (campo) =>
        formulario.setData(campo.target.name, campo.target.value);

    // Return simplificado
    return {
        paso, setPaso,
        rango, setRango,
        form: formulario, formData: formulario.data,
        modoNuevo, setModoNuevo,
        query, setQuery,
        resultados, cargando,
        seleccionado, seleccionarCliente,
        cargandoHabitaciones, habitacionesSeleccionadas,
        actualizarSeleccionHabitacion, getTotalHabitaciones,
        error, limpiarRango,
        continuar, volverAtras,
        cambioCampo, siguiente,
        onConfirmar,
        getTiposHabitacion,
        getImagen,
        getIcono,
        reservaNoEsParaMi,
        setReservaNoEsParaMi,
        currentUser,
    };
}
