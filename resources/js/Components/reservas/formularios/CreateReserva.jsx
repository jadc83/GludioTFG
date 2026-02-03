import Campo from '@/Components/formulario/Campo';
import FormularioPago from '@/Components/pagos/FormularioPago';
import BusquedaClientes from '@/Components/reservas/formularios/BusquedaClientes';
import Boton from '@/Components/UI/Boton';
import {
    calcularPrecio,
    obtenerHabitacionesDisponibles,
    obtenerTarifas,
} from '@/hooks/reservas/service';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';
import {
    CalendarIcon,
    CreditCardIcon,
    HomeIcon,
    TagIcon,
    UserIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ModalConfirmacionReserva from '@/Components/reservas/modales/ModalConfirmacionReserva';

export default function CreateReserva({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('fechas');
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
    const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [habitacionesPorTipo, setHabitacionesPorTipo] = useState({}); // { tipo: { cantidad: 0, disponibles: 0, precio: 0 } }
    const [precioCalculado, setPrecioCalculado] = useState(0);
    const [tarifas, setTarifas] = useState([]);
    const [tarifasSeleccionadas, setTarifasSeleccionadas] = useState([]);
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);

    const datosIniciales = {
        // Fechas
        check_in: '',
        check_out: '',

        // Cliente
        reservable_type: 'cliente',
        reservable_id: '',
        nombre_cliente: '',
        email_cliente: '',
        telefono_cliente: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',

        // Habitaciones
        habitaciones: [],

        // Huéspedes
        num_huespedes: 1,

        // Pago
        metodo_pago: 'recepcion',
        precio_total: 0,

        // Tarifas
        tarifas: [],

        // Notas
        notas: '',
    };

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        actualizarCampo,
        setData,
    } = useFormGenerico(datosIniciales, '/reservas', '', () => {
        handleCerrar();
    });

    const handleCerrar = () => {
        setAbierto(false);
        setHabitacionesDisponibles([]);
        setHabitacionesPorTipo({});
        setPrecioCalculado(0);
        setClienteSeleccionado(null);
        setTabActiva('fechas');
        setTarifasSeleccionadas([]);
    };

    // Cargar tarifas al abrir
    useEffect(() => {
        if (!abierto) return;

        obtenerTarifas().then((data) => {
            console.log('Tarifas cargadas:', data);
            setTarifas(data || []);
        });
    }, [abierto]);

    // Buscar habitaciones disponibles cuando cambian las fechas
    useEffect(() => {
        if (!formulario.check_in || !formulario.check_out) {
            setHabitacionesDisponibles([]);
            return;
        }

        // Validar que check_out sea posterior a check_in
        if (new Date(formulario.check_out) <= new Date(formulario.check_in)) {
            setHabitacionesDisponibles([]);
            return;
        }

        setCargandoHabitaciones(true);
        obtenerHabitacionesDisponibles(
            formulario.check_in,
            formulario.check_out,
        )
            .then((data) => {
                console.log('Habitaciones disponibles:', data);
                setHabitacionesDisponibles(data || []);

                // Agrupar por tipo
                const porTipo = {};
                (data || []).forEach((hab) => {
                    console.log(
                        'Procesando habitación:',
                        hab.tipo,
                        'precio_noche:',
                        hab.precio_noche,
                    );
                    if (!porTipo[hab.tipo]) {
                        porTipo[hab.tipo] = {
                            cantidad: 0,
                            disponibles: 0,
                            precio: parseFloat(hab.precio_noche) || 0,
                            habitaciones: [],
                        };
                    }
                    porTipo[hab.tipo].disponibles++;
                    porTipo[hab.tipo].habitaciones.push(hab);
                });
                console.log('Habitaciones por tipo:', porTipo);
                setHabitacionesPorTipo(porTipo);
            })
            .finally(() => {
                setCargandoHabitaciones(false);
            });
    }, [formulario.check_in, formulario.check_out]);

    // Calcular precio cuando cambian las habitaciones seleccionadas o tarifas
    useEffect(() => {
        const habitacionesConCantidad = Object.entries(habitacionesPorTipo)
            .filter(([_, info]) => info.cantidad > 0)
            .map(([tipo, info]) => ({ tipo, cantidad: info.cantidad }));

        if (
            !formulario.check_in ||
            !formulario.check_out ||
            habitacionesConCantidad.length === 0
        ) {
            setPrecioCalculado(0);
            actualizarCampo('precio_total', 0);
            return;
        }

        const payload = {
            check_in: formulario.check_in,
            check_out: formulario.check_out,
            habitaciones: habitacionesConCantidad,
            tarifas: tarifasSeleccionadas,
        };

        console.log('Calculando precio con payload:', payload);

        // Calcular precio
        calcularPrecio(payload)
            .then((data) => {
                const total = data?.data?.total || 0;
                setPrecioCalculado(total);
                actualizarCampo('precio_total', total);
            })
            .catch((err) => {
                console.error('Error calculando precio:', err);
                console.error('Error response:', err.response?.data);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        habitacionesPorTipo,
        formulario.check_in,
        formulario.check_out,
        tarifasSeleccionadas,
    ]);

    const cambiarCantidadHabitaciones = (tipo, cantidad) => {
        setHabitacionesPorTipo((prev) => ({
            ...prev,
            [tipo]: {
                ...prev[tipo],
                cantidad: Math.max(
                    0,
                    Math.min(cantidad, prev[tipo].disponibles),
                ),
            },
        }));
    };

    // Validar si el formulario está completo para habilitar el botón
    const esFormularioCompleto = () => {
        // Fechas requeridas
        if (!formulario.check_in || !formulario.check_out) {
            console.log('Faltan fechas');
            return false;
        }

        // Al menos una habitación seleccionada
        if (!Object.values(habitacionesPorTipo).some((info) => info.cantidad > 0)) {
            console.log('No hay habitaciones seleccionadas');
            return false;
        }

        // Datos del cliente requeridos (solo nombre, email y documento por ahora)
        if (!formulario.nombre_cliente || !formulario.email_cliente) {
            console.log('Faltan datos del cliente:', { nombre: formulario.nombre_cliente, email: formulario.email_cliente });
            return false;
        }

        // Documento requerido
        if (!formulario.numero_documento) {
            console.log('Falta número de documento');
            return false;
        }

        // Método de pago seleccionado
        if (!formulario.metodo_pago) {
            console.log('Falta método de pago');
            return false;
        }

        // Aceptación de términos (solo si es visible)
        if (formulario.metodo_pago === 'tarjeta' && !aceptaTerminos) {
            console.log('No aceptó términos para tarjeta');
            return false;
        }

        console.log('Formulario completo');
        return true;
    };

    const handleSeleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);

        if (cliente) {
            actualizarCampo('reservable_id', cliente.id);
            actualizarCampo(
                'reservable_type',
                cliente.tipo_usuario === 'user'
                    ? 'App\\Models\\User'
                    : 'App\\Models\\Cliente',
            );
            actualizarCampo('nombre_cliente', cliente.name);
            actualizarCampo('email_cliente', cliente.email);
            actualizarCampo('telefono_cliente', cliente.telefono || '');
            actualizarCampo('tipo_documento', cliente.tipo_documento || 'dni');
            actualizarCampo('numero_documento', cliente.numero_documento || '');
            actualizarCampo('nacionalidad', cliente.nacionalidad || '');
            actualizarCampo('direccion', cliente.direccion || '');
        } else {
            // Limpiar campos cuando se deselecciona
            actualizarCampo('reservable_id', '');
            actualizarCampo('reservable_type', 'cliente');
            actualizarCampo('nombre_cliente', '');
            actualizarCampo('email_cliente', '');
            actualizarCampo('telefono_cliente', '');
            actualizarCampo('tipo_documento', 'dni');
            actualizarCampo('numero_documento', '');
            actualizarCampo('nacionalidad', '');
            actualizarCampo('direccion', '');
        }
    };

    const guardar = async (e) => {
        e.preventDefault();

        const habitacionesConCantidad = Object.entries(
            habitacionesPorTipo,
        ).filter(([_, info]) => info.cantidad > 0);

        if (habitacionesConCantidad.length === 0) {
            alert('Debes seleccionar al menos una habitación');
            return;
        }

        // Construir array de habitaciones para el backend
        const habitacionesParaReserva = habitacionesConCantidad.map(
            ([tipo, info]) => ({
                tipo: tipo,
                cantidad: info.cantidad,
            }),
        );

        // Construir payload con nombres de campos correctos para el backend
        const payload = {
            check_in: formulario.check_in,
            check_out: formulario.check_out,

            // Datos del cliente (usar 'name' como espera el backend)
            name: formulario.nombre_cliente || undefined,
            email: formulario.email_cliente || undefined,
            telefono: formulario.telefono_cliente || undefined,
            tipo_documento: formulario.tipo_documento || 'dni',
            numero_documento: formulario.numero_documento || undefined,
            nacionalidad: formulario.nacionalidad || undefined,
            direccion: formulario.direccion || undefined,

            // Si hay cliente seleccionado, enviar también el ID
            ...(formulario.reservable_id && {
                reservable_type: formulario.reservable_type,
                reservable_id: formulario.reservable_id,
            }),

            // Habitaciones y tarifas
            habitaciones: habitacionesParaReserva,
            tarifas:
                tarifasSeleccionadas.length > 0
                    ? tarifasSeleccionadas
                    : undefined,

            // Otros datos
            num_huespedes: formulario.num_huespedes || 1,
            metodo_pago: formulario.metodo_pago || 'recepcion',
            notas: formulario.notas || undefined,
        };

        // Eliminar campos undefined
        Object.keys(payload).forEach((key) => {
            if (payload[key] === undefined) {
                delete payload[key];
            }
        });

        console.log('Enviando payload:', payload);

        router.post('/reservas', payload, {
            onSuccess: (page) => {
                console.log('Reserva creada exitosamente:', page);
                handleCerrar();
                // Esperar a que se cierre el modal antes de recargar
                setTimeout(() => {
                    router.reload({ only: ['reservas'] });
                }, 300);
            },
            onError: (errors) => {
                console.error('Errores de validación:', errors);
                // Mostrar primera pestaña con error
                if (errors.check_in || errors.check_out) setTabActiva('fechas');
                else if (errors.name || errors.email) setTabActiva('cliente');
                else if (errors.habitaciones) setTabActiva('fechas');
            },
        });
    };

    const tieneErrores = (campos) => campos.some((campo) => !!errores[campo]);

    const getTabClass = (id, campos) => {
        const esActiva = tabActiva === id;
        const conError = campos.length > 0 && tieneErrores(campos);
        let base =
            'flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-200 ';

        if (conError) {
            return (
                base +
                (esActiva
                    ? 'text-red-600 border-red-600 bg-red-50'
                    : 'text-red-400 border-transparent hover:text-red-500')
            );
        }
        return (
            base +
            (esActiva
                ? 'text-[#7a0202] border-[#7a0202] bg-red-50/30'
                : 'text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50')
        );
    };

    const toggleTarifa = (tarifaId) => {
        setTarifasSeleccionadas((prev) =>
            prev.includes(tarifaId)
                ? prev.filter((id) => id !== tarifaId)
                : [...prev, tarifaId],
        );
    };

    return (
        <>
            <Boton
                onClick={() => setAbierto(true)}
                icon={CalendarIcon}
                variant="primary"
                size={iconOnly ? 'sm' : 'md'}
                className={iconOnly ? '!px-3 !py-3' : ''}
                title="Nueva Reserva"
                aria-label="Nueva Reserva"
            >
                {!iconOnly && 'Nueva Reserva'}
            </Boton>

            {/* CONTENEDOR RAIZ: Z-index extremo para flotar */}
            <div
                className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-300 md:top-16 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCerrar}
                />

                {/* Panel Lateral (Slide-over) - Más ancho para mostrar más info */}
                <div
                    className={`absolute inset-0 flex w-full max-w-full transform flex-col bg-white shadow-2xl transition-transform duration-500 md:bottom-0 md:left-auto md:right-0 md:top-0 md:max-w-2xl ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden rounded-none md:!rounded-l-[2rem]`}
                >
                    {/* Header estilo Gludio */}
                    <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                                Nueva{' '}
                                <span className="text-[#7a0202]">Reserva</span>
                            </h3>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Sistema PMS / Panel de Control
                            </p>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    {/* Navegación por Pestañas */}
                    <nav className="flex flex-none border-b border-gray-100 bg-white">
                        <button
                            type="button"
                            className={getTabClass('fechas', [
                                'check_in',
                                'check_out',
                            ])}
                            onClick={() => setTabActiva('fechas')}
                        >
                            <CalendarIcon className="h-4 w-4" /> Fechas
                        </button>
                        <button
                            type="button"
                            className={getTabClass('cliente', [
                                'nombre_cliente',
                                'email_cliente',
                                'telefono_cliente',
                                'numero_documento',
                            ])}
                            onClick={() => setTabActiva('cliente')}
                        >
                            <UserIcon className="h-4 w-4" /> Cliente
                        </button>
                        <button
                            type="button"
                            className={getTabClass('tarifas', [])}
                            onClick={() => setTabActiva('tarifas')}
                        >
                            <TagIcon className="h-4 w-4" /> Tarifas
                        </button>
                        <button
                            type="button"
                            className={getTabClass('pago', [
                                'metodo_pago',
                                'num_huespedes',
                            ])}
                            onClick={() => setTabActiva('pago')}
                        >
                            <CreditCardIcon className="h-4 w-4" /> Pago
                        </button>
                    </nav>

                    {/* Formulario con scroll independiente */}
                    <form
                        onSubmit={guardar}
                        className="flex min-h-0 flex-1 flex-col bg-white"
                    >
                        <div className="flex-1 space-y-8 overflow-y-auto p-8">
                            {/* Pestaña: Fechas */}
                            {tabActiva === 'fechas' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <Campo
                                        id="check_in"
                                        label="Check-in"
                                        type="date"
                                        value={formulario.check_in}
                                        onChange={cambiar}
                                        error={errores.check_in}
                                        required
                                    />
                                    <Campo
                                        id="check_out"
                                        label="Check-out"
                                        type="date"
                                        value={formulario.check_out}
                                        onChange={cambiar}
                                        error={errores.check_out}
                                        required
                                    />

                                    {/* Sección de Habitaciones */}
                                    <div className="mt-8 space-y-4">
                                        <div className="flex items-center gap-3 border-l-4 border-[#7a0202] pl-4">
                                            <HomeIcon className="h-5 w-5 text-[#7a0202]" />
                                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">
                                                Habitaciones Disponibles
                                            </h4>
                                        </div>

                                        {!formulario.check_in ||
                                        !formulario.check_out ? (
                                            <div className="rounded-lg bg-gray-50 p-6 text-center">
                                                <p className="text-sm text-gray-500">
                                                    Completa las fechas para ver
                                                    habitaciones disponibles
                                                </p>
                                            </div>
                                        ) : cargandoHabitaciones ? (
                                            <div className="rounded-lg bg-gray-50 p-6 text-center">
                                                <p className="text-sm text-gray-500">
                                                    Cargando habitaciones...
                                                </p>
                                            </div>
                                        ) : Object.keys(habitacionesPorTipo)
                                              .length === 0 ? (
                                            <div className="rounded-lg bg-red-50 p-6 text-center">
                                                <p className="text-sm text-red-600">
                                                    No hay habitaciones
                                                    disponibles para las fechas
                                                    seleccionadas
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {Object.entries(
                                                    habitacionesPorTipo,
                                                ).map(([tipo, info]) => (
                                                    <div
                                                        key={tipo}
                                                        className="rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-[#7a0202]"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <h5 className="text-sm font-black uppercase text-gray-900">
                                                                        {tipo}
                                                                    </h5>
                                                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                                                        {
                                                                            info.disponibles
                                                                        }{' '}
                                                                        disponibles
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    €
                                                                    {
                                                                        info.precio
                                                                    }{' '}
                                                                    / noche
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        cambiarCantidadHabitaciones(
                                                                            tipo,
                                                                            info.cantidad -
                                                                                1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        info.cantidad ===
                                                                        0
                                                                    }
                                                                    className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-700 transition-all hover:border-[#7a0202] hover:bg-red-50 hover:text-[#7a0202] disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-8 text-center text-sm font-bold text-gray-900">
                                                                    {
                                                                        info.cantidad
                                                                    }
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        cambiarCantidadHabitaciones(
                                                                            tipo,
                                                                            info.cantidad +
                                                                                1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        info.cantidad >=
                                                                        info.disponibles
                                                                    }
                                                                    className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-700 transition-all hover:border-[#7a0202] hover:bg-red-50 hover:text-[#7a0202] disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pestaña: Cliente */}
                            {tabActiva === 'cliente' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <BusquedaClientes
                                        onSeleccionar={handleSeleccionarCliente}
                                        clienteSeleccionado={
                                            clienteSeleccionado
                                        }
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Campo
                                            id="nombre_cliente"
                                            label="Nombre Completo"
                                            value={formulario.nombre_cliente}
                                            onChange={cambiar}
                                            error={errores.nombre_cliente}
                                            required
                                        />
                                        <Campo
                                            id="email_cliente"
                                            label="Email"
                                            type="email"
                                            value={formulario.email_cliente}
                                            onChange={cambiar}
                                            error={errores.email_cliente}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Campo
                                            id="telefono_cliente"
                                            label="Teléfono"
                                            type="tel"
                                            value={formulario.telefono_cliente}
                                            onChange={cambiar}
                                            error={errores.telefono_cliente}
                                            required
                                        />
                                        <Campo
                                            id="tipo_documento"
                                            label="Tipo de Documento"
                                            as="select"
                                            value={formulario.tipo_documento}
                                            onChange={cambiar}
                                            error={errores.tipo_documento}
                                            required
                                        >
                                            {Object.entries(
                                                TIPOS_DOCUMENTO,
                                            ).map(([clave, valor]) => (
                                                <option
                                                    key={clave}
                                                    value={valor}
                                                >
                                                    {valor.toUpperCase()}
                                                </option>
                                            ))}
                                        </Campo>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Campo
                                            id="numero_documento"
                                            label="Número de Documento"
                                            value={formulario.numero_documento}
                                            onChange={cambiar}
                                            error={errores.numero_documento}
                                            required
                                        />
                                        <Campo
                                            id="nacionalidad"
                                            label="Nacionalidad"
                                            value={formulario.nacionalidad}
                                            onChange={cambiar}
                                            error={errores.nacionalidad}
                                            required
                                        />
                                    </div>

                                    <Campo
                                        id="direccion"
                                        label="Dirección"
                                        value={formulario.direccion}
                                        onChange={cambiar}
                                        error={errores.direccion}
                                        required
                                    />
                                </div>
                            )}

                            {/* Pestaña: Tarifas */}
                            {tabActiva === 'tarifas' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    {tarifas.length === 0 ? (
                                        <div className="rounded-lg bg-gray-50 p-6 text-center">
                                            <p className="text-sm text-gray-500">
                                                No hay tarifas disponibles
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {tarifas.map((tarifa) => (
                                                <div
                                                    key={tarifa.id}
                                                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                                        tarifasSeleccionadas.includes(
                                                            tarifa.id,
                                                        )
                                                            ? 'border-[#7a0202] bg-red-50'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}
                                                    onClick={() =>
                                                        toggleTarifa(tarifa.id)
                                                    }
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={tarifasSeleccionadas.includes(
                                                                tarifa.id,
                                                            )}
                                                            onChange={() =>
                                                                toggleTarifa(
                                                                    tarifa.id,
                                                                )
                                                            }
                                                            className="mt-1 h-5 w-5 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                                        />
                                                        <div className="flex-1">
                                                            <h5 className="text-sm font-black uppercase text-gray-900">
                                                                {tarifa.nombre}
                                                            </h5>
                                                            {tarifa.descripcion && (
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    {
                                                                        tarifa.descripcion
                                                                    }
                                                                </p>
                                                            )}
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span
                                                                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                                                                        tarifa.tipo_modificador ===
                                                                        'porcentaje'
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-green-100 text-green-700'
                                                                    }`}
                                                                >
                                                                    {tarifa.tipo_modificador ===
                                                                    'porcentaje'
                                                                        ? `${tarifa.valor > 0 ? '+' : ''}${tarifa.valor}%`
                                                                        : `${tarifa.valor > 0 ? '+' : ''}€${Math.abs(tarifa.valor)}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pestaña: Pago */}
                            {tabActiva === 'pago' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Campo
                                            id="num_huespedes"
                                            label="Número de Huéspedes"
                                            type="number"
                                            min={1}
                                            max={4}
                                            value={formulario.num_huespedes}
                                            onChange={(e) =>
                                                actualizarCampo(
                                                    'num_huespedes',
                                                    Math.min(
                                                        4,
                                                        Math.max(
                                                            1,
                                                            Number(e.target.value) || 1,
                                                        ),
                                                    ),
                                                )
                                            }
                                            error={errores.num_huespedes}
                                            required
                                        />
                                        <Campo
                                            id="metodo_pago"
                                            label="Método de Pago"
                                            as="select"
                                            value={formulario.metodo_pago}
                                            onChange={cambiar}
                                            error={errores.metodo_pago}
                                            required
                                        >
                                            <option value="recepcion">
                                                Pagar en Recepción
                                            </option>
                                            <option value="tarjeta">
                                                Tarjeta de Crédito
                                            </option>
                                            <option value="transferencia">
                                                Transferencia
                                            </option>
                                        </Campo>
                                    </div>

                                    <Campo
                                        id="notas"
                                        label="Notas / Observaciones (Opcional)"
                                        as="textarea"
                                        rows="3"
                                        value={formulario.notas}
                                        onChange={cambiar}
                                        error={errores.notas}
                                    />

                                    {/* RESUMEN DE PRECIO */}
                                    {precioCalculado > 0 && (
                                        <div className="rounded-xl border-2 border-[#7a0202] bg-red-50 p-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-black uppercase tracking-tight text-gray-900">
                                                    Precio Total
                                                </span>
                                                <span className="text-3xl font-black text-[#7a0202]">
                                                    €
                                                    {precioCalculado.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* FORMULARIO DE PAGO STRIPE */}
                                    {formulario.metodo_pago === 'tarjeta' &&
                                        precioCalculado > 0 && (
                                            <div className="animate-in slide-in-from-top-4 duration-500">
                                                <div className="mb-4 flex items-center gap-3 border-l-4 border-black pl-4">
                                                    <CreditCardIcon className="h-5 w-5 text-black" />
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">
                                                        Datos de la Tarjeta
                                                    </h4>
                                                </div>

                                                <FormularioPago
                                                    monto={precioCalculado}
                                                    reservaData={{
                                                        check_in:
                                                            formulario.check_in,
                                                        check_out:
                                                            formulario.check_out,
                                                        name: formulario.nombre_cliente,
                                                        email: formulario.email_cliente,
                                                        telefono:
                                                            formulario.telefono_cliente,
                                                        habitaciones:
                                                            Object.entries(
                                                                habitacionesPorTipo,
                                                            )
                                                                .filter(
                                                                    ([
                                                                        _,
                                                                        info,
                                                                    ]) =>
                                                                        info.cantidad >
                                                                        0,
                                                                )
                                                                .map(
                                                                    ([
                                                                        tipo,
                                                                        info,
                                                                    ]) => ({
                                                                        tipo,
                                                                        cantidad:
                                                                            info.cantidad,
                                                                    }),
                                                                ),
                                                        tarifas:
                                                            tarifasSeleccionadas,
                                                        num_huespedes:
                                                            formulario.num_huespedes,
                                                        metodo_pago: 'tarjeta',
                                                        notas: formulario.notas,
                                                        reservable_id:
                                                            formulario.reservable_id,
                                                        reservable_type:
                                                            formulario.reservable_type,
                                                    }}
                                                    aceptaTerminos={
                                                        aceptaTerminos
                                                    }
                                                    mostrarAceptacion={true}
                                                    onAceptaChange={
                                                        setAceptaTerminos
                                                    }
                                                    onPagoExitoso={(data) => {
                                                        console.log(
                                                            'Pago exitoso desde CreateReserva:',
                                                            data,
                                                        );
                                                        try {
                                                            const confirm = data?.confirmData || {};
                                                            const localizador = confirm?.localizador || null;
                                                            const cantidad_habitaciones = Object.values(
                                                                habitacionesPorTipo,
                                                            ).reduce((s, info) => s + (info.cantidad || 0), 0);

                                                            const datosConfirmacion = {
                                                                localizador: localizador,
                                                                nombre: formulario.nombre_cliente,
                                                                check_in: formulario.check_in,
                                                                check_out: formulario.check_out,
                                                                cantidad_habitaciones,
                                                                precio_total: precioCalculado,
                                                                pagoAlLlegar: false,
                                                            };

                                                            handleCerrar();
                                                            setDatosReservaConfirmada(datosConfirmacion);
                                                            setMostrarModalConfirmacion(true);
                                                        } catch (err) {
                                                            console.error('Error preparando confirmación:', err);
                                                            handleCerrar();
                                                            router.reload({ only: ['reservas'] });
                                                        }
                                                    }}
                                                    onError={(err) => {
                                                        console.error(
                                                            'Error en pago:',
                                                            err,
                                                        );
                                                    }}
                                                />
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>

                        {/* Footer con botones */}
                        <footer className="flex flex-none items-center justify-between border-t border-gray-100 bg-gray-50 p-6">
                            <div className="flex items-center gap-2">
                                {precioCalculado > 0 && (
                                    <span className="text-sm font-bold text-gray-700">
                                        Total:{' '}
                                        <span className="text-lg text-[#7a0202]">
                                            €{precioCalculado.toFixed(2)}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <Boton
                                    type="button"
                                    variant="outline"
                                    onClick={handleCerrar}
                                    disabled={estaCargando}
                                >
                                    Cancelar
                                </Boton>
                                {/* Mostrar botón 'Crear Reserva' como fallback si Stripe no está configurado */}
                                <Boton
                                    type="submit"
                                    variant="primary"
                                    color="danger"
                                    loading={estaCargando}
                                    className={
                                        formulario.metodo_pago === 'tarjeta' && import.meta.env.VITE_STRIPE_PUBLIC_KEY
                                            ? 'hidden'
                                            : ''
                                    }
                                    disabled={
                                        estaCargando ||
                                        !esFormularioCompleto()
                                    }
                                >
                                    {formulario.metodo_pago === 'tarjeta' && !import.meta.env.VITE_STRIPE_PUBLIC_KEY
                                        ? 'Crear Reserva (Pago en Recepción)'
                                        : 'Crear Reserva'}
                                </Boton>
                            </div>
                        </footer>
                    </form>
                </div>
            </div>

            {/* Modal de Confirmación tras pago */}
            <ModalConfirmacionReserva
                reserva={datosReservaConfirmada}
                isOpen={mostrarModalConfirmacion}
                onClose={() => {
                    setMostrarModalConfirmacion(false);
                    setDatosReservaConfirmada(null);
                    // Recargar lista de reservas para reflejar la nueva reserva
                    try {
                        router.reload({ only: ['reservas'] });
                    } catch (e) {
                        window.location.reload();
                    }
                }}
            />
        </>
    );
}
