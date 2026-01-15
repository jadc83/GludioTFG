import { useEffect, useState } from 'react';
import { formatearFecha } from '../utils/fecha';

/**
 * Hook para gestionar habitaciones disponibles y seleccionadas
 */
export default function useHabitaciones({ paso, rango, setRango }) {
    // Estado de habitaciones disponibles
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
    const [estaCargandoHabitaciones, setEstaCargandoHabitaciones] = useState(false);

    // Estado de habitaciones seleccionadas
    const [habitacionesSeleccionadas, setHabitacionesSeleccionadas] = useState({});

    /**
     * Carga habitaciones disponibles desde el servidor
     * El servidor ya devuelve agrupadas por tipo y con precios calculados
     */
    useEffect(() => {
        if (paso !== 2) {
            setEstaCargandoHabitaciones(false);
            return;
        }

        const obtenerHabitacionesDisponibles = async () => {
            if (!rango?.from || !rango?.to) {
                setHabitacionesDisponibles([]);
                setEstaCargandoHabitaciones(false);
                return;
            }

            // Resetear selecciones cuando cambia el rango
            setHabitacionesSeleccionadas({});
            setEstaCargandoHabitaciones(true);

            try {
                const fechaEntrada = formatearFecha(rango.from);
                const fechaSalida = formatearFecha(rango.to);

                const respuesta = await fetch(
                    `/reservas/disponibles?check_in=${fechaEntrada}&check_out=${fechaSalida}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'include'
                    }
                );

                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    setHabitacionesDisponibles(Array.isArray(datos) ? datos : []);
                } else {
                    setHabitacionesDisponibles([]);
                }
            } catch (error) {
                console.error('Error al cargar habitaciones:', error);
                setHabitacionesDisponibles([]);
            } finally {
                setEstaCargandoHabitaciones(false);
            }
        };

        obtenerHabitacionesDisponibles();
    }, [paso, rango]);

    /**
     * Agrupa habitaciones disponibles por tipo
     */
    const agruparHabitacionesPorTipo = () => {
        const habitacionesPorTipo = {};

        habitacionesDisponibles.forEach((grupo) => {
            const tipo = grupo.tipo;
            habitacionesPorTipo[tipo] = {
                cantidad: grupo.cantidad,
                capacidadMaxima: grupo.capacidadMaxima,
                precioMinimo: grupo.precioMinimo,
                precioNoche: grupo.precioNoche,
                precioTotal: grupo.precioTotal,
                habitaciones: grupo.habitaciones,
            };
        });

        return habitacionesPorTipo;
    };

    /**
     * Obtiene el icono Unicode para un tipo de habitación
     */
    const getIcono = (tipo) => {
        const iconos = { individual: '🛏️', doble: '🛏️🛏️', familiar: '👨‍👩‍👧‍👦',  suite: '👑' };
        return iconos[tipo?.toLowerCase()] || '🏨';
    };

    /**
     * Obtiene la URL de imagen para un tipo de habitación
     */
    const getImagen = (tipo) => {
        const imagenes = {
            individual: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
            doble: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
            familiar: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
            suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
        };
        return imagenes[tipo?.toLowerCase()] ||
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop';
    };

    /**
     * Calcula el total de habitaciones seleccionadas
     */
    const getTotalHabitaciones = () => {
        return Object.values(habitacionesSeleccionadas).reduce(
            (total, seleccion) => total + (seleccion.cantidad || 0),
            0,
        );
    };

    /**
     * Obtiene el total de habitaciones disponibles en el rango seleccionado
     */
    const getTotalDisponibles = () => {
        return habitacionesDisponibles.reduce((total, grupo) => total + grupo.cantidad, 0);
    };

    /**
     * Actualiza un campo de la selección de habitación de un tipo
     */
    const actualizarSeleccionHabitacion = (tipo, campo, valor) => {
        setHabitacionesSeleccionadas((seleccionesActuales) => {
            const seleccionActual = seleccionesActuales[tipo] || {};
            const seleccionActualizada = { ...seleccionActual, [campo]: valor };

            // Si se aumenta la cantidad y no hay personas, establecer al menos 1
            if (campo === 'cantidad' && Number(valor) > 0) {
                seleccionActualizada.personas =
                    Number(seleccionActual.personas) > 0
                        ? Number(seleccionActual.personas)
                        : 1;
            }

            // Asegurar que personas siempre sea > 0
            if (campo === 'personas') {
                const cantidadPersonas = Number(valor);
                seleccionActualizada.personas = cantidadPersonas > 0 ? cantidadPersonas : 1;
            }

            return {
                ...seleccionesActuales,
                [tipo]: seleccionActualizada,
            };
        });
    };

    /**
     * Elimina la selección de un tipo de habitación
     */
    const eliminarTipoHabitacion = (tipo) => {
        setHabitacionesSeleccionadas((seleccionesActuales) => {
            const seleccionesActualizadas = { ...seleccionesActuales };
            delete seleccionesActualizadas[tipo];
            return seleccionesActualizadas;
        });
    };

    /**
     * Resetea todas las selecciones de habitaciones
     */
    const resetSeleccion = () => setHabitacionesSeleccionadas({});

    /**
     * Limpia el rango de fechas seleccionado
     */
    const limpiarRango = () => setRango(null);

    return {
        // Rango de fechas
        rango,
        setRango,
        limpiarRango,

        // Habitaciones disponibles
        habitacionesDisponibles,
        estaCargandoHabitaciones,

        // Habitaciones seleccionadas
        habitacionesSeleccionadas,
        setHabitacionesSeleccionadas,

        // Métodos de consulta
        agruparHabitacionesPorTipo,
        getTotalHabitaciones,
        getTotalDisponibles,

        // Métodos de UI
        getIcono,
        getImagen,

        // Métodos de actualización
        actualizarSeleccionHabitacion,
        eliminarTipoHabitacion,
        resetSeleccion,
    };
}

