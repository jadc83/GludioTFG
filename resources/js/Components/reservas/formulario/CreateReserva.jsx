import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import useReservaForm from '@/hooks/useReservaForm';
import CreateReservaPaso1 from './CreateReservaPaso1';
import CreateReservaPaso2 from './CreateReservaPaso2';
import '@/../css/createCliente.css';


const FORM_INICIAL = { name: '', email: '', telefono: '', tipo_documento: 'dni', numero_documento: '', nacionalidad: '', direccion: '',
                       check_in: '', check_out: '', notas: ''
};

const validarPaso1 = (form) => {
    const errores = {};

    if (!form.name?.trim()) { errores.name = 'Nombre requerido';}
    if (!form.numero_documento?.trim()) { errores.numero_documento = 'Documento requerido';}
    if (!form.check_in || !form.check_out) { errores.fechas = 'Fechas requeridas';}

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

export default function CreateReserva({ habitacionesDisponibles: habitacionesIniciales = [], onSuccess }) {

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
    const formHabitaciones = useReservaForm(habitacionesDisponibles);

    useEffect(() => {
        if (modoNuevoCliente) {
            setResultadosBusqueda([]);
            setCargandoBusqueda(false);
            return;
        }

        if (busqueda.length < 3) {
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
                console.error('Error al buscar clientes:', error);
                setResultadosBusqueda([]);
            } finally {
                setCargandoBusqueda(false);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [busqueda, modoNuevoCliente]);




    const resetearFormulario = useCallback(() => {
        setIsOpen(false);

        setTimeout(() => {
            setStep(1);
            setForm(FORM_INICIAL);
            setErrores({});
            setModoNuevoCliente(true);
            setBusqueda('');
            setClienteSeleccionado(null);
            formHabitaciones.setSeleccionadas([]);
        }, 200);
    }, [formHabitaciones]);

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);


        setTimeout(() => {
            setBusqueda('');
            setResultadosBusqueda([]);
        }, 150);

        if (cliente) {
            setForm(prev => ({
                ...prev,
                ...rellenarFormulario(cliente)
            }));
        } else {
            setForm(prev => ({
                ...FORM_INICIAL,
                check_in: prev.check_in,
                check_out: prev.check_out,
                notas: prev.notas
            }));
        }
    };

    const cambiarCampoFormulario = (e) => {

        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errores[name]) {
            setErrores(prev => ({ ...prev, [name]: '' }));
        }

        if ((name === 'check_in' || name === 'check_out') && value) {
            const nuevoForm = { ...form, [name]: value };

            if (nuevoForm.check_in && nuevoForm.check_out) {
                fetch(`/reservas/disponibles?check_in=${nuevoForm.check_in}&check_out=${nuevoForm.check_out}`)
                    .then(res => res.json())
                    .then(habitaciones => {
                        setHabitacionesDisponibles(habitaciones);
                    })
                    .catch(err => {
                        console.error('Error al obtener habitaciones disponibles:', err);
                    });
            }
        }
    };

    const avanzarAPaso2 = (e) => {
        e.preventDefault();

        const nuevosErrores = validarPaso1(form);

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            return;
        }

        setStep(2);
    };

    const confirmarReserva = () => {
        if (!formHabitaciones.esValido) return;

        setGuardando(true);

        const payload = {
            ...form,
            habitacion_ids: formHabitaciones.seleccionadas,
            reservable_id: clienteSeleccionado?.id || null,
            tipo_usuario: clienteSeleccionado?.tipo_usuario || null,
            crear_cliente: modoNuevoCliente
        };

        router.post(route('reservas.store'), payload, {
            onSuccess: () => {
                setGuardando(false);
                onSuccess?.();
                resetearFormulario();
            },
            onError: (erroresServidor) => {
                setErrores(erroresServidor);
                setGuardando(false);

                if (erroresServidor.name || erroresServidor.numero_documento) {
                    setStep(1);
                }
            }
        });
    };

    return (
        <>

            <PrimaryButton onClick={() => setIsOpen(true)}>
                <PlusIcon className="w-5 h-5 mr-1" /> Nueva Reserva
            </PrimaryButton>


            <dialog className={`drawer-modal ${isOpen ? 'modal-open' : ''}`}>
                <div className={`drawer-panel ${isOpen ? 'abierto' : 'cerrado'} w-full max-w-2xl`}>


                    <div className="drawer-header flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            {step === 1 ? '👤 Datos del Cliente' : '🏨 Selección de Habitaciones'}
                            <span className="badge badge-sm badge-ghost">{step}/2</span>
                        </h3>
                        <button onClick={resetearFormulario} className="btn btn-sm btn-circle btn-ghost">
                            ✕
                        </button>
                    </div>


                    <div className="flex-1 overflow-y-auto">
                        {step === 1 && (
                            <CreateReservaPaso1 form={form} errores={errores} onChange={cambiarCampoFormulario} onNext={avanzarAPaso2}
                                searchProps={{
                                    modoNuevo: modoNuevoCliente,
                                    setModoNuevo: setModoNuevoCliente,
                                    query: busqueda,
                                    setQuery: setBusqueda,
                                    resultados: resultadosBusqueda,
                                    cargando: cargandoBusqueda,
                                    seleccionado: clienteSeleccionado,
                                    onSeleccionar: seleccionarCliente}}/>
                        )}

                        {step === 2 && (
                            <CreateReservaPaso2
                                habitaciones={habitacionesDisponibles}
                                formHabitaciones={formHabitaciones}
                                guardando={guardando}
                                onBack={() => setStep(1)}
                                onSubmit={confirmarReserva}/>
                        )}
                    </div>
                </div>
            </dialog>
        </>
    );
}
