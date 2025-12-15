import { useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';

const FORM_INICIAL = { name: '',  email: '', telefono: '', tipo_documento: 'dni', numero_documento: '', nacionalidad: '', direccion: '', check_in: '', check_out: '', notas: '' };

const validarPaso1 = (form) => {
    const errores = {};
    if (!form.name?.trim()) errores.name = 'Nombre requerido';
    if (!form.numero_documento?.trim()) errores.numero_documento = 'Documento requerido';
    if (!form.check_in || !form.check_out) errores.fechas = 'Fechas requeridas';
    return errores;
};

const rellenarFormulario = (cliente) => {
    if (!cliente) return {};
    return {
        name: cliente.nombre || cliente.name || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        numero_documento: cliente.numero_documento || '',
        nacionalidad: cliente.nacionalidad || '',
        direccion: cliente.direccion || 'Sin dirección',
        tipo_documento: cliente.tipo_documento || 'dni'
    };
};

export default function useReservaForm(habitacionesIniciales = [], onSuccess = null) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [guardando, setGuardando] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    const [errores, setErrores] = useState({});
    const [modoNuevoCliente, setModoNuevoCliente] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState(habitacionesIniciales);
    const [seleccionadas, setSeleccionadas] = useState([]);

    useEffect(() => {

        if (modoNuevoCliente || busqueda.length < 3) {
            setResultadosBusqueda([]);
            setCargandoBusqueda(false);
            return;
        }

        setCargandoBusqueda(true);
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/clientes/buscar?query=${encodeURIComponent(busqueda)}`);
                const data = await response.json();
                setResultadosBusqueda(data || []);
            } catch (error) {
                setResultadosBusqueda([]);
            } finally {
                setCargandoBusqueda(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [busqueda, modoNuevoCliente]);

    useEffect(() => {
        if (form.check_in && form.check_out) {
            fetch(`/reservas/disponibles?check_in=${form.check_in}&check_out=${form.check_out}`)
                .then(res => res.json())
                .then(habitaciones => setHabitacionesDisponibles(habitaciones))
                .catch(() => setHabitacionesDisponibles([]));
        }
    }, [form.check_in, form.check_out]);

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

    const cambiarCampo = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errores[name]) {
            setErrores(prev => ({ ...prev, [name]: '' }));
        }
    }, [errores]);

    const seleccionarCliente = useCallback((cliente) => {
        setClienteSeleccionado(cliente);
        setBusqueda('');
        setResultadosBusqueda([]);

        if (cliente) {
            setForm(prev => ({ ...prev, ...rellenarFormulario(cliente) }));
        } else {
            setForm(prev => ({
                ...FORM_INICIAL,
                check_in: prev.check_in,
                check_out: prev.check_out,
                notas: prev.notas
            }));
        }
    }, []);

    const avanzarAPaso2 = useCallback((e) => {
        e?.preventDefault();
        const nuevosErrores = validarPaso1(form);
        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            return false;
        }
        setStep(2);
        return true;
    }, [form]);

    const retrocederAPaso1 = useCallback(() => {
        setStep(1);
    }, []);

    const confirmarReserva = useCallback(() => {
        if (seleccionadas.length === 0) return;

        setGuardando(true);
        const payload = {
            ...form,
            habitacion_ids: seleccionadas,
            reservable_id: clienteSeleccionado?.id || null,
            tipo_usuario: clienteSeleccionado?.tipo_usuario || null,
            crear_cliente: modoNuevoCliente
        };

        router.post(route('reservas.store'), payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setGuardando(false);
                onSuccess?.();
                router.reload({ only: ['reservas', 'habitaciones', 'habitacionesDisponibles'] });
            },
            onError: (erroresServidor) => {
                setErrores(erroresServidor);
                setGuardando(false);
                if (erroresServidor.name || erroresServidor.numero_documento) {
                    setStep(1);
                }
            }
        });
    }, [form, seleccionadas, clienteSeleccionado, modoNuevoCliente, onSuccess]);

    const limpiar = useCallback(() => {
        setStep(1);
        setForm(FORM_INICIAL);
        setErrores({});
        setModoNuevoCliente(true);
        setBusqueda('');
        setClienteSeleccionado(null);
        setSeleccionadas([]);
    }, []);

    const resetear = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => {
            limpiar();
        }, 200);
    }, [limpiar]);

    return {
        isOpen, setIsOpen, step, guardando,
        paso1Props: {
            form, errores, onChange: cambiarCampo, onNext: avanzarAPaso2, searchProps: {
                modoNuevo: modoNuevoCliente,
                setModoNuevo: setModoNuevoCliente,
                query: busqueda,
                setQuery: setBusqueda,
                resultados: resultadosBusqueda,
                cargando: cargandoBusqueda,
                seleccionado: clienteSeleccionado,
                onSeleccionar: seleccionarCliente
            }
        },
        paso2Props: {
            habitaciones: habitacionesDisponibles,
            formHabitaciones: {
                seleccionadas,
                toggleHabitacion,
                precioEstimado,
                esValido: seleccionadas.length > 0,
                textoResumen: `${seleccionadas.length} habitación${seleccionadas.length !== 1 ? 'es' : ''} • €${precioEstimado.toFixed(2)}`
            },
            guardando,
            onBack: retrocederAPaso1,
            onSubmit: confirmarReserva },
            resetear,
            limpiar
    };
}
