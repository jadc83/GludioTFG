import { useEffect, useState } from 'react';
import { formatearFecha } from '../utils/fecha';
import { calcularPrecioDinamico } from '../utils/precios';

export default function useHabitaciones({ paso, rango, setRango }) {
    const [availableRooms, setAvailableRooms] = useState([]);
    const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);
    const [habitacionesSeleccionadas, sethabitacionesSeleccionadas] = useState({});
    const [tiempoInicioCarga, setTiempoInicioCarga] = useState(null);

    // Fetch de habitaciones disponibles
    useEffect(() => {
        if (paso !== 2) {
            setCargandoHabitaciones(false);
            setTiempoInicioCarga(null);
            return;
        }

        const fetchRooms = async () => {
            if (!rango?.from || !rango?.to) {
                setAvailableRooms([]);
                setCargandoHabitaciones(false);
                setTiempoInicioCarga(null);
                return;
            }

            sethabitacionesSeleccionadas({});
            setCargandoHabitaciones(true);
            setTiempoInicioCarga(Date.now());

            try {
                const check_in = formatearFecha(rango.from);
                const check_out = formatearFecha(rango.to);
                const res = await fetch(
                    `/reservas/disponibles?check_in=${check_in}&check_out=${check_out}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'include'
                    },
                );
                if (res.ok) {
                    const json = await res.json();
                    // Asegurar que se muestra la carga por al menos 2000ms
                    const tiempoTranscurrido = Date.now() - tiempoInicioCarga;
                    const delayRestante = Math.max(0, 2000 - tiempoTranscurrido);

                    setTimeout(() => {
                        setAvailableRooms(Array.isArray(json) ? json : []);
                        setCargandoHabitaciones(false);
                    }, delayRestante);
                } else {
                    setAvailableRooms([]);
                    setCargandoHabitaciones(false);
                }
            } catch (err) {
                setAvailableRooms([]);
                setCargandoHabitaciones(false);
            }
        };

        fetchRooms();
    }, [paso, rango]);

    const getTiposHabitacion = () => {
        const types = {};
        availableRooms.forEach((r) => {
            if (!types[r.tipo]) {
                types[r.tipo] = {
                    count: 0,
                    maxCap: 0,
                    minPrice: Infinity,
                    rooms: [],
                };
            }
            types[r.tipo].count++;
            types[r.tipo].maxCap = Math.max(
                types[r.tipo].maxCap,
                r.capacidad || 1,
            );

            const precioDinamico = calcularPrecioDinamico(
                r,
                rango?.from,
                rango?.to,
            );
            types[r.tipo].minPrice = Math.min(
                types[r.tipo].minPrice,
                precioDinamico,
            );
            types[r.tipo].rooms.push(r);
        });

        Object.values(types).forEach((t) => {
            if (t.minPrice === Infinity) t.minPrice = null;
        });

        return types;
    };

    const getIcono = (tipo) => {
        const icons = {
            Individual: '🛏️',
            Doble: '🛏️🛏️',
            Familiar: '👨‍👩‍👧‍👦',
            Suite: '👑',
        };
        return icons[tipo] || '🏨';
    };

    const getImagen = (tipo) => {
        const images = {
            Individual:
                'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
            Doble: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
            Familiar:
                'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
            Suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
        };
        return (
            images[tipo] ||
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop'
        );
    };

    const getTotalHabitaciones = () => {
        return Object.values(habitacionesSeleccionadas).reduce(
            (sum, r) => sum + (r.cantidad || 0),
            0,
        );
    };

    const actualizarSeleccionHabitacion = (tipo, field, value) => {
        sethabitacionesSeleccionadas((prev) => {
            const prevEntry = prev[tipo] || {};
            const nextEntry = { ...prevEntry, [field]: value };

            if (field === 'cantidad' && Number(value) > 0) {
                nextEntry.personas =
                    Number(prevEntry.personas) > 0
                        ? Number(prevEntry.personas)
                        : 1;
            }

            if (field === 'personas') {
                const n = Number(value);
                nextEntry.personas = n > 0 ? n : 1;
            }

            return {
                ...prev,
                [tipo]: nextEntry,
            };
        });
    };

    const eliminarTipoHabitacion = (tipo) => {
        sethabitacionesSeleccionadas((prev) => {
            const next = { ...prev };
            delete next[tipo];
            return next;
        });
    };

    const resetSeleccion = () => sethabitacionesSeleccionadas({});

    const limpiarRango = () => setRango(null);

    return {
        rango,
        setRango,
        availableRooms,
        cargandoHabitaciones,
        habitacionesSeleccionadas,
        sethabitacionesSeleccionadas,
        getTiposHabitacion,
        getIcono,
        getImagen,
        getTotalHabitaciones,
        actualizarSeleccionHabitacion,
        eliminarTipoHabitacion,
        resetSeleccion,
        limpiarRango,
    };
}
