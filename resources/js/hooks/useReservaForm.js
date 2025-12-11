import { useState, useCallback } from 'react';

export default function useReservaForm(habitacionesDisponibles = []) {

    const [seleccionadas, setSeleccionadas] = useState([]);

    const toggleHabitacion = useCallback((habitacionId) => {
        setSeleccionadas(prev =>
            prev.includes(habitacionId)
                ? prev.filter(id => id !== habitacionId)
                : [...prev, habitacionId]
        );
    }, []);

    const precioEstimado = habitacionesDisponibles
        .filter(h => seleccionadas.includes(h.id))
        .reduce((sum, h) => sum + parseFloat(h.precio_noche || 0), 0);

    const datosHabitaciones = {
        habitacion_ids: seleccionadas,
        precio_total: precioEstimado.toFixed(2)
    };

    const esValido = seleccionadas.length > 0;

    const textoResumen = `${seleccionadas.length} habitación${seleccionadas.length !== 1 ? 'es' : ''} • €${precioEstimado.toFixed(2)}`;

    const limpiarHabitaciones = useCallback(() => setSeleccionadas([]), []);

    return {
        seleccionadas,

        toggleHabitacion,

        precioEstimado,

        datosHabitaciones,

        esValido,

        textoResumen,

        limpiarHabitaciones,

        setSeleccionadas
    };
}
