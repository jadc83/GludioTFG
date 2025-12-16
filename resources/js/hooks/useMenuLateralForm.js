import { useEffect, useState } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';

export default function useFormularioMenuLateral() {
    const [paso, setPaso] = useState(1);
    const [rango, setRango] = useState({ from: undefined, to: undefined });
    const formulario = useForm({
        name: '',
        email: '',
        telefono: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
    });
    const [modoNuevo, setModoNuevo] = useState(true);
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [seleccionado, setSeleccionado] = useState(null);
    const [reservableId, setReservableId] = useState(null);
    const [reservableTipo, setReservableTipo] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState({});
    const [error, setError] = useState('');
    const page = usePage();
    const currentUser = page?.props?.auth?.user ?? null;
    const [reservaNoEsParaMi, setReservaNoEsParaMi] = useState(currentUser ? false : true);

    useEffect(() => {
        if (modoNuevo) return setResultados([]);

        if (!query || query.length < 3) {
            setResultados([]);
            return;
        }

        let activo = true;
        setCargando(true);

        const id = setTimeout(async () => {
            try {
                const url = `/clientes/buscar?query=${encodeURIComponent(query)}`;
                const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                if (!activo) return;
                if (res.ok) {
                    const json = await res.json();
                    setResultados(Array.isArray(json) ? json : (json || []));
                } else {
                    setResultados([]);
                }
            } catch (err) {
                setResultados([]);
            } finally {
                if (activo) setCargando(false);
            }
        }, 300);

        return () => { activo = false; clearTimeout(id); };
    }, [query, modoNuevo]);

    useEffect(() => {
        if (!error) return;
        const tiempo = setTimeout(() => setError(''), 5000);
        return () => clearTimeout(tiempo);
    }, [error]);

    const limpiarRango = () => setRango(null);

    const continuar = () => {
        if (paso === 1 && (!rango?.from || !rango?.to))
            return setError('Selecciona un rango de fechas.');
        setError('');

        if (paso === 1 && currentUser && !reservaNoEsParaMi) {

            setReservableId(currentUser.id);
            setReservableTipo('usuario');
            try {
                formulario.setData('name', currentUser.name || formulario.data.name);
                formulario.setData('email', currentUser.email || formulario.data.email);
                formulario.setData('telefono', currentUser.telefono || formulario.data.telefono || '');
                formulario.setData('tipo_documento', currentUser.tipo_documento || formulario.data.tipo_documento);
                formulario.setData('numero_documento', currentUser.numero_documento || formulario.data.numero_documento || '');
                formulario.setData('nacionalidad', currentUser.nacionalidad || formulario.data.nacionalidad || '');
                formulario.setData('direccion', currentUser.direccion || formulario.data.direccion || '');
            } catch (e) { }
            setPaso(3);
            return;
        }
        setPaso(paso + 1);
    };
    const volverAtras = () => {

        if (currentUser && paso === 3) { setPaso(1); return; }
        setPaso(paso - 1);
    };

    const cambioCampo = (campo) =>
        formulario.setData(campo.target.name, campo.target.value);

    const seleccionarCliente = (p) => {
        setSeleccionado(p);
        if (p) {
            formulario.setData('name', p.nombre || p.name || formulario.data.name);
            formulario.setData('email', p.email || formulario.data.email);
            formulario.setData('telefono', p.telefono || formulario.data.telefono);
            formulario.setData('tipo_documento', p.tipo_documento || formulario.data.tipo_documento);
            formulario.setData('numero_documento', p.numero_documento || formulario.data.numero_documento);
            formulario.setData('nacionalidad', p.nacionalidad ?? formulario.data.nacionalidad);
            formulario.setData('direccion', p.direccion ?? formulario.data.direccion);
        } else {
            formulario.setData('name', '');
            formulario.setData('email', '');
            formulario.setData('telefono', '');
            formulario.setData('tipo_documento', 'dni');
            formulario.setData('numero_documento', '');
            formulario.setData('nacionalidad', '');
            formulario.setData('direccion', '');
        }
    };

    const handleNext = () => {
        if (seleccionado) {
            setReservableId(seleccionado.id);
            setReservableTipo(seleccionado.tipo_usuario);
        } else {
            setReservableId(null);
            setReservableTipo(null);
        }

        continuar();
    };

    const formatDate = (d) => {
        if (!d) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    useEffect(() => {
        const fetchRooms = async () => {
            if (!rango?.from || !rango?.to) return setAvailableRooms([]);
            setSelectedRooms({});
            setLoadingRooms(true);
            try {
                const check_in = formatDate(rango.from);
                const check_out = formatDate(rango.to);
                const res = await fetch(`/reservas/disponibles?check_in=${check_in}&check_out=${check_out}`, { headers: { 'Accept': 'application/json' } });
                if (res.ok) {
                    const json = await res.json();
                    setAvailableRooms(Array.isArray(json) ? json : []);
                } else {
                    setAvailableRooms([]);
                }
            } catch (err) {
                setAvailableRooms([]);
            } finally {
                setLoadingRooms(false);
            }
        };

        if (paso === 3) fetchRooms();
    }, [paso, rango]);

    const calcularPrecioDinamicoFrontend = (habitacion, checkIn, checkOut) => {
        if (!checkIn || !checkOut) return habitacion.precio_noche || 0;

        let total = 0;
        let fecha = new Date(checkIn);
        const fechaFin = new Date(checkOut);

        while (fecha < fechaFin) {
            let modificador = 1.0;

            const mes = fecha.getMonth() + 1;
            const dia = fecha.getDate();
            if (mes === 7 || mes === 8 || (mes === 12 && dia >= 20)) {
                modificador *= 1.5;
            } else if ((mes === 3 || mes === 4) && dia >= 15 && dia <= 31) {
                modificador *= 1.2;
            }

            if (fecha.getDay() === 0 || fecha.getDay() === 6) {
                modificador *= 1.25;
            }

            const fechaFormato = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const festivos = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-25'];
            if (festivos.includes(fechaFormato)) {
                modificador *= 1.5;
            }

            total += (habitacion.precio_noche || 0) * modificador;
            fecha.setDate(fecha.getDate() + 1);
        }

        return Math.round(total);
    };

    const getRoomTypes = () => {
        const types = {};
        availableRooms.forEach(r => {
            if (!types[r.tipo]) {
                types[r.tipo] = { count: 0, maxCap: 0, minPrice: Infinity, rooms: [] };
            }
            types[r.tipo].count++;
            types[r.tipo].maxCap = Math.max(types[r.tipo].maxCap, r.capacidad || 1);

            const precioDinamico = calcularPrecioDinamicoFrontend(r, rango?.from, rango?.to);
            types[r.tipo].minPrice = Math.min(types[r.tipo].minPrice, precioDinamico);
            types[r.tipo].rooms.push(r);
        });

        Object.values(types).forEach(t => {
            if (t.minPrice === Infinity) t.minPrice = null;
        });

        return types;
    };

    const getRoomTypeIcon = (tipo) => {
        const icons = {
            'Individual': '🛏️',
            'Doble': '🛏️🛏️',
            'Familiar': '👨‍👩‍👧‍👦',
            'Suite': '👑',
        };
        return icons[tipo] || '🏨';
    };

    const getRoomTypeImage = (tipo) => {
        const images = {
            'Individual': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
            'Doble': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
            'Familiar': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
            'Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
        };
        return images[tipo] || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop';
    };

    const getTotalRoomsSelected = () => {
        return Object.values(selectedRooms).reduce((sum, r) => sum + (r.cantidad || 0), 0);
    };

    const actualizarSeleccionHabitacion = (tipo, field, value) => {
        setSelectedRooms(prev => {
            const prevEntry = prev[tipo] || {};
            const nextEntry = { ...prevEntry, [field]: value };

            if (field === 'cantidad' && Number(value) > 0) {
                nextEntry.personas = Number(prevEntry.personas) > 0 ? Number(prevEntry.personas) : 1;
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
        setSelectedRooms(prev => {
            const next = { ...prev };
            delete next[tipo];
            return next;
        });
    };

    const resetSeleccion = () => setSelectedRooms({});

    const onConfirmar = () => {
        const check_in = rango?.from ? formatDate(rango.from) : null;
        const check_out = rango?.to ? formatDate(rango.to) : null;

        formulario.setData('check_in', check_in);
        formulario.setData('check_out', check_out);

        if (reservableId && reservableTipo) {
            formulario.setData('reservable_id', reservableId);
            formulario.setData('tipo_usuario', reservableTipo);
        }

        if (Object.keys(selectedRooms).length > 0) {
            const habitaciones = Object.entries(selectedRooms)
                .filter(([_, r]) => r.cantidad > 0)
                .map(([tipo, r]) => ({
                    tipo,
                    cantidad: r.cantidad,
                    personas_por_habitacion: (Number(r.personas) > 0 ? Number(r.personas) : 1),
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

        if (Object.keys(selectedRooms).length > 0) {
            respuesta.habitaciones = Object.entries(selectedRooms)
                .filter(([_, r]) => r.cantidad > 0)
                .map(([tipo, r]) => ({
                    tipo,
                    cantidad: r.cantidad,
                    personas_por_habitacion: (Number(r.personas) > 0 ? Number(r.personas) : 1),
                }));
        }

        if (respuesta.tipo_usuario === 'cliente' && currentUser) {
            respuesta.booked_by_user_id = currentUser.id;
        }

        router.post('/reservas', respuesta, {
            onSuccess: () => {
                try { document.getElementById('drawer-toggle').checked = false; } catch (e) { }

                try {
                    if (typeof formulario.reset === 'function') formulario.reset();
                } catch (e) { }

                setPaso(1);
                setRango({ from: undefined, to: undefined });
                setSelectedRooms({});
                setAvailableRooms([]);
                setReservableId(null);
                setReservableTipo(null);
                setSeleccionado(null);
                setModoNuevo(true);
                setQuery('');
                setResultados([]);
                setReservaNoEsParaMi(currentUser ? false : true);
            },
            onError: (errors) => {
                try {
                    if (typeof formulario.setErrors === 'function') {
                        formulario.setErrors(errors || {});
                    } else if (typeof formulario.setError === 'function') {
                        formulario.setError(errors || {});
                    } else {
                        setError(errors.message || Object.values(errors)[0] || 'Error al crear la reserva');
                    }
                } catch (e) {
                    setError('Error al crear la reserva');
                }
            }
        });
    };

    return {
        paso,
        setPaso,
        rango,
        setRango,
        form: formulario,
        formData: formulario.data,
        modoNuevo,
        setModoNuevo,
        query,
        setQuery,
        resultados,
        cargando,
        seleccionado,
        seleccionarCliente,
        reservableId,
        reservableTipo,
        availableRooms,
        loadingRooms,
        selectedRooms,
        actualizarSeleccionHabitacion,
        eliminarTipoHabitacion,
        getTotalRoomsSelected,
        resetSeleccion,
        error,
        limpiarRango,
        continuar,
        volverAtras,
        cambioCampo,
        handleNext,
        onConfirmar,
        formatDate,
        getRoomTypes,
        getRoomTypeImage,
        getRoomTypeIcon,
        reservaNoEsParaMi,
        setReservaNoEsParaMi,
        currentUser,
    };
}
