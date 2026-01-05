import { useEffect, useState } from 'react';
import { formatearFecha } from '../utils/fecha';
import { calcularPrecioDinamico } from '../utils/precios';

export default function useHabitaciones({ paso, rango, setRango }) {
    // Estado de habitaciones disponibles
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
    const [estaCargandoHabitaciones, setEstaCargandoHabitaciones] = useState(false);
    const [tiempoInicioCarga, setTiempoInicioCarga] = useState(null);

    // Estado de habitaciones seleccionadas
    const [habitacionesSeleccionadas, setHabitacionesSeleccionadas] = useState({});

    /**
     * Carga habitaciones disponibles cuando cambia el paso o rango de fechas
     */
    useEffect(() => {
        if (paso !== 2) {
            setEstaCargandoHabitaciones(false);
            setTiempoInicioCarga(null);
            return;
        }

        const obtenerHabitacionesDisponibles = async () => {
            if (!rango?.from || !rango?.to) {
                setHabitacionesDisponibles([]);
                setEstaCargandoHabitaciones(false);
                setTiempoInicioCarga(null);
                return;
            }

            // Resetear selecciones cuando cambia el rango
            setHabitacionesSeleccionadas({});
            setEstaCargandoHabitaciones(true);
            setTiempoInicioCarga(Date.now());

            try {
                const fechaEntrada = formatearFecha(rango.from);
                const fechaSalida = formatearFecha(rango.to);
                const respuesta = await fetch(
                    `/reservas/disponibles?check_in=${fechaEntrada}&check_out=${fechaSalida}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'include'
                    },
                );

                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    // Asegurar que se muestra el estado de carga por al menos 2000ms
                    const tiempoTranscurrido = Date.now() - tiempoInicioCarga;
                    const delayRestante = Math.max(0, 2000 - tiempoTranscurrido);

                    setTimeout(() => {
                        setHabitacionesDisponibles(Array.isArray(datos) ? datos : []);
                        setEstaCargandoHabitaciones(false);
                    }, delayRestante);
                } else {
                    console.error('❌ Error al obtener habitaciones disponibles:', respuesta.status);
                    setHabitacionesDisponibles([]);
                    setEstaCargandoHabitaciones(false);
                }
            } catch (error) {
                console.error('❌ Error al cargar habitaciones disponibles:', error);
                setHabitacionesDisponibles([]);
                setEstaCargandoHabitaciones(false);
            }
        };

        obtenerHabitacionesDisponibles();
    }, [paso, rango]);

    /**
     * Agrupa habitaciones disponibles por tipo
     * @returns {Object} Objeto con tipos de habitación como keys
     */
    const agruparHabitacionesPorTipo = () => {
        const habitacionesPorTipo = {};

        habitacionesDisponibles.forEach((habitacion) => {
            const tipo = habitacion.tipo;

            if (!habitacionesPorTipo[tipo]) {
                habitacionesPorTipo[tipo] = {
                    cantidad: 0,
                    capacidadMaxima: 0,
                    precioMinimo: Infinity,
                    habitaciones: [],
                };
            }

            habitacionesPorTipo[tipo].cantidad++;
            habitacionesPorTipo[tipo].capacidadMaxima = Math.max(
                habitacionesPorTipo[tipo].capacidadMaxima,
                habitacion.capacidad || 1,
            );

            const precioDinamico = calcularPrecioDinamico(
                habitacion,
                rango?.from,
                rango?.to,
            );

            habitacionesPorTipo[tipo].precioMinimo = Math.min(
                habitacionesPorTipo[tipo].precioMinimo,
                precioDinamico,
            );
            habitacionesPorTipo[tipo].habitaciones.push(habitacion);
        });

        // Normalizar precios infinitos
        Object.values(habitacionesPorTipo).forEach((datosHabitacion) => {
            if (datosHabitacion.precioMinimo === Infinity) {
                datosHabitacion.precioMinimo = null;
            }
        });

        return habitacionesPorTipo;
    };

    /**
     * Obtiene el icono Unicode para un tipo de habitación
     * @param {string} tipo - Tipo de habitación (Individual, Doble, Familiar, Suite)
     * @returns {string} Icono Unicode
     */
    const getIcono = (tipo) => {
        const iconos = {
            Individual: '🛏️',
            Doble: '🛏️🛏️',
            Familiar: '👨‍👩‍👧‍👦',
            Suite: '👑',
        };
        return iconos[tipo] || '🏨';
    };

    /**
     * Obtiene la URL de imagen para un tipo de habitación
     * @param {string} tipo - Tipo de habitación
     * @returns {string} URL de imagen Unsplash
     */
    const getImagen = (tipo) => {
        const imagenes = {
            Individual:
                'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
            Doble: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
            Familiar:
                'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
            Suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
        };
        return (
            imagenes[tipo] ||
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop'
        );
    };

    /**
     * Calcula el total de habitaciones seleccionadas
     * @returns {number} Total de habitaciones
     */
    const getTotalHabitaciones = () => {
        return Object.values(habitacionesSeleccionadas).reduce(
            (total, seleccion) => total + (seleccion.cantidad || 0),
            0,
        );
    };

    /**
     * Actualiza un campo de la selección de habitación de un tipo
     * @param {string} tipo - Tipo de habitación
     * @param {string} campo - Campo a actualizar (cantidad, personas)
     * @param {any} valor - Nuevo valor
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
     * @param {string} tipo - Tipo de habitación a eliminar
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

        // Métodos de UI
        getIcono,
        getImagen,

        // Métodos de actualización
        actualizarSeleccionHabitacion,
        eliminarTipoHabitacion,
        resetSeleccion,
    };
}
