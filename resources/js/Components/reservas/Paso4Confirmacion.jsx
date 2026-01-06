import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import PrimaryButton from '../PrimaryButton';
import FormularioPago from '../pagos/FormularioPago';
import ModalConfirmacionReserva from './ModalConfirmacionReserva';

export default function Paso4Confirmacion({
    rango,
    watch,
    habitacionesSeleccionadas,
    getTotalHabitaciones,
    retrocederPaso,
    calcularMontoTotal,
    usuarioActual,
    getValues,
    idClienteSeleccionado,
    tipoClienteSeleccionado,
    localizador,
    setPasoActual,
    limpiarRango,
    setValue,
    actualizarSeleccionHabitacion,
    habitacionesDisponibles,
    calcularPrecioDinamico,
    obtenerPrecioBase,
}) {
    const formData = watch();
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';
    const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false);
    const [errorPago, setErrorPago] = useState(null);
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);
    const [pagarAlLlegar, setPagarAlLlegar] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [opcionPagoSeleccionada, setOpcionPagoSeleccionada] = useState(true);
    const monto = calcularMontoTotal?.() || 0;

    // Función para calcular el precio real de una habitación por TIPO
    const calcularPrecioHabitacion = (tipoHabitacion, cantidad) => {
        if (!obtenerPrecioBase || !calcularPrecioDinamico) return 0;

        const precioBase = obtenerPrecioBase(habitacionesDisponibles, tipoHabitacion);
        if (!precioBase) return 0;

        const precioDiario = calcularPrecioDinamico(precioBase, rango?.from, rango?.to);
        const milisegundosPorDia = 24 * 60 * 60 * 1000;
        const numeroNoches = Math.ceil((rango?.to - rango?.from) / milisegundosPorDia) || 0;

        return precioDiario * cantidad * numeroNoches;
    };

    // Debug: log del localizador cuando cambia
    useEffect(() => {
        console.log('🔍 Paso4Confirmacion - localizador recibido:', localizador);
    }, [localizador]);

    // Crear reserva para pago al llegar (opción En recepción)
    const crearReservaAlLlegar = async () => {
        try {
            setProcesando(true);
            setErrorPago(null);
            const reserva = prepararDatosReserva();
            console.log('🔄 Creando reserva (pago al llegar):', reserva);

            const res = await fetch('/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(reserva),
            });

            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                let errorMessage = `HTTP ${res.status}`;
                if (contentType?.includes('application/json')) {
                    const error = await res.json();
                    errorMessage = error.message || error.error || errorMessage;
                } else {
                    const text = await res.text();
                    errorMessage = `Error del servidor (HTTP ${res.status}). Revisa los logs del servidor PHP.`;
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();
            // Mostrar modal de confirmación - usar formData.name como en Stripe
            const datosConfirmacion = {
                localizador: data.localizador,
                nombre: formData.name,
                check_in: rango?.from,
                check_out: rango?.to,
                cantidad_habitaciones: getTotalHabitaciones(),
                precio_total: monto,
                pagoAlLlegar: true,
            };
            setDatosReservaConfirmada(datosConfirmacion);
            setTimeout(() => {
                setMostrarModalConfirmacion(true);
                console.log('📋 Estado mostrarModalConfirmacion después:', true);
            }, 100);
        } catch (error) {
            setErrorPago(error.message || 'Error desconocido al crear la reserva');
        } finally {
            setProcesando(false);
        }
    };

    // Preparar datos de la reserva para el formulario de pago
    const prepararDatosReserva = () => {
        const values = getValues();
        const habitaciones = Object.entries(habitacionesSeleccionadas)
            .filter(([, r]) => r.cantidad > 0)
            .map(([tipo, r]) => ({
                tipo,
                cantidad: r.cantidad,
                personas_por_habitacion: Number(r.personas) > 0 ? Number(r.personas) : 1,
            }));

        return {
            name: values.name,
            email: values.email,
            telefono: values.telefono,
            tipo_documento: values.tipo_documento,
            numero_documento: values.numero_documento,
            nacionalidad: values.nacionalidad,
            direccion: values.direccion,
            check_in: rango?.from,
            check_out: rango?.to,
            habitaciones,
            reservable_id: idClienteSeleccionado,
            tipo_usuario: tipoClienteSeleccionado || 'cliente',
            booked_by_user_id: usuarioActual?.id || null,
        };
    };

    const handleCerrarDrawer = () => {
        const checkbox = document.getElementById('drawer-toggle');
        if (checkbox) {
            checkbox.checked = false;
        }
    };

    const handleResetearReserva = () => {
        console.log('🔄 Reseteando reserva...');
        // Cerrar el modal
        setMostrarModalConfirmacion(false);
        setDatosReservaConfirmada(null);

        // Resetear formulario
        setValue('name', '');
        setValue('email', '');
        setValue('telefono', '');
        setValue('tipo_documento', 'dni');
        setValue('numero_documento', '');
        setValue('nacionalidad', '');
        setValue('direccion', '');

        // Resetear fechas
        limpiarRango();

        // Resetear selección de habitaciones (iterar y limpiar)
        Object.keys(habitacionesSeleccionadas).forEach(tipo => {
            if (actualizarSeleccionHabitacion) {
                actualizarSeleccionHabitacion(tipo, 0, 0);
            }
        });

        // Resetear formulario de pago
        setMostrarFormularioPago(false);
        setErrorPago(null);

        // Volver al paso 1
        setPasoActual(1);

        // Cerrar el drawer
        handleCerrarDrawer();

        // Recargar la tabla de reservas
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-2 flex max-w-md justify-center space-x-2 text-xs">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <div key={i} className="flex items-center">
                    <span className={`font-semibold uppercase tracking-wider ${i === 3 ? 'text-red-600' : 'text-gray-400'}`}>{etiqueta}</span>
                    {i < 3 && <span className="ml-2 text-gray-300">→</span>}
                </div>
            ))}
        </nav>
    );

    const renderRow = (label, value) => (
        <tr className="border-b border-gray-200">
            <th className="w-2/5 py-0.5 pr-1 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">{label}</th>
            <td className="py-0.5 text-left text-xs font-medium text-gray-900">{value}</td>
        </tr>
    );

    return (
        <main className="flex h-full flex-col bg-gris p-3">
            <header className="mb-1 border-b border-gray-200 pb-1">
                <h3 className="mb-0.5 text-center text-sm font-bold text-gray-900">Confirmación de Reserva</h3>
                <Migitas />
            </header>

            <section className="flex-1 overflow-hidden">
                <div className="space-y-2">
                    {/* Resumen */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Resumen de tu Reserva</h4>

                        <div className="space-y-2">
                            {/* Número de reserva */}
                            {localizador && (
                                <div className="pb-1">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Localizador</p>
                                    <p className="font-mono font-bold text-[#7a0202] text-base tracking-wide">{localizador}</p>
                                </div>
                            )}

                            {/* Huésped, fechas y habitaciones */}
                            <div className="grid grid-cols-5 gap-0 w-full">
                                {/* Huésped */}
                                <div className="px-2 text-center">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Huésped</p>
                                    <p className="text-xs font-medium text-gray-900">{formData.name}</p>
                                </div>

                                {/* Estancia */}
                                <div className="px-2 text-center">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Estancia</p>
                                    <p className="text-xs font-medium text-gray-900">
                                        {(() => {
                                            const milisegundosPorDia = 24 * 60 * 60 * 1000;
                                            const numeroNoches = Math.ceil((rango?.to - rango?.from) / milisegundosPorDia) || 0;
                                            return `${numeroNoches} noche${numeroNoches !== 1 ? 's' : ''}`;
                                        })()}
                                    </p>
                                </div>

                                {/* Fechas */}
                                <div className="px-2 text-center">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Fechas</p>
                                    <p className="text-xs font-medium text-gray-900">{rango?.from?.toLocaleDateString('es-ES')} - {rango?.to?.toLocaleDateString('es-ES')}</p>
                                </div>

                                {/* Precio por Noche */}
                                <div className="px-2 text-center">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Precio/Noche</p>
                                    <p className="text-xs font-medium text-gray-900">
                                        {(() => {
                                            // Obtener el precio dinámico del primer tipo de habitación seleccionado
                                            const primeraHabitacion = Object.keys(habitacionesSeleccionadas).find((tipo) => habitacionesSeleccionadas[tipo]?.cantidad > 0);
                                            if (primeraHabitacion && calcularPrecioDinamico && rango?.from && rango?.to) {
                                                const precioBase = obtenerPrecioBase(habitacionesDisponibles, primeraHabitacion);
                                                if (typeof precioBase === 'number' && precioBase > 0) {
                                                    const precioDinamico = calcularPrecioDinamico(precioBase, rango.from, rango.to);
                                                    return `$${precioDinamico.toFixed(2)}`;
                                                }
                                            }
                                            return '—';
                                        })()}
                                    </p>
                                </div>

                                {/* Habitaciones */}
                                <div className="px-2 text-center">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Habitaciones</p>
                                    <div className="space-y-1">
                                        {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                            <div key={tipo} className="text-xs">
                                                <p className="font-medium text-gray-900">{r.cantidad}x {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
                                                <p className="text-xs text-gray-600">{r.personas || 1} {(r.personas || 1) === 1 ? 'huésped' : 'huéspedes'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Monto a Pagar */}
                            <div className="w-full pt-2 border-t border-gray-200">
                                {getTotalHabitaciones() > 1 ? (
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Desglose de Factura</p>

                                        {/* Tabla de desglose */}
                                        <div className="space-y-1 text-xs">
                                            {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => {
                                                const milisegundosPorDia = 24 * 60 * 60 * 1000;
                                                const numeroNoches = Math.ceil((rango?.to - rango?.from) / milisegundosPorDia) || 0;
                                                // Usar el precio base del TIPO de habitación
                                                const precioHabitacion = calcularPrecioHabitacion(tipo, r.cantidad);
                                                const precioBase = obtenerPrecioBase ? obtenerPrecioBase(habitacionesDisponibles, tipo) : 0;
                                                const precioPorNoche = precioBase && calcularPrecioDinamico
                                                    ? calcularPrecioDinamico(precioBase, rango?.from, rango?.to)
                                                    : 0;

                                                return (
                                                    <div key={tipo} className="border border-gray-200 rounded p-3 bg-gray-50">
                                                        {/* Encabezado del artículo */}
                                                        <p className="font-medium text-gray-900 mb-2">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>

                                                        {/* Detalles */}
                                                        <div className="text-xs text-gray-700 mb-2 pl-2 border-l-2 border-gray-300">
                                                            <div className="flex items-center gap-1">
                                                                <span>× {r.cantidad} habitación{r.cantidad !== 1 ? 'es' : ''}</span>
                                                                <span>×</span>
                                                                <span>{numeroNoches} noche{numeroNoches !== 1 ? 's' : ''}</span>
                                                                <span>×</span>
                                                                <span>${precioPorNoche.toFixed(2)} por noche</span>
                                                            </div>
                                                        </div>

                                                        {/* Subtotal */}
                                                        <div className="flex items-center justify-between border-t border-gray-300 pt-1.5 font-semibold text-sm">
                                                            <span className="text-gray-700">Subtotal</span>
                                                            <span className="text-[#7a0202]">${precioHabitacion.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Total Final */}
                                        <div className="flex items-center justify-between pt-3 font-bold text-xs">
                                            <span className="text-gray-900">Total a Pagar</span>
                                            <span className="text-base text-[#7a0202]">${monto.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between pt-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Monto a Pagar</p>
                                        <p className="text-base font-bold text-[#7a0202]">${monto.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Opción de pago - PRIMERO elegir, LUEGO mostrar formulario */}
                    <div className="pt-2 space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600">Forma de Pago</h4>
                        <div className="flex gap-2">
                            <label className="flex-1 flex items-center gap-2 p-3 rounded border-2 cursor-pointer transition text-xs"
                                style={{ borderColor: !pagarAlLlegar ? '#dc2626' : '#d1d5db', backgroundColor: !pagarAlLlegar ? '#fef2f2' : '#f3f4f6'}}>
                                <input type="radio" name="metodoPago" checked={!pagarAlLlegar} onChange={() => {
                                        setPagarAlLlegar(false);
                                        setOpcionPagoSeleccionada(true);
                                    }} className="h-4 w-4 cursor-pointer" />
                                <span className="font-medium text-gray-900">Tarjeta</span>
                            </label>

                            <label className="flex-1 flex items-center gap-2 p-3 rounded border-2 cursor-pointer transition text-xs"
                                style={{ borderColor: pagarAlLlegar ? '#7a0202' : '#d1d5db', backgroundColor: pagarAlLlegar ? '#fef2f2' : '#f3f4f6'}}>
                                <input type="radio" name="metodoPago" checked={pagarAlLlegar} onChange={() => {
                                        setPagarAlLlegar(true);
                                        setOpcionPagoSeleccionada(true);}}
                                    className="h-4 w-4 cursor-pointer"/>
                                <span className="font-medium text-gray-900">En recepción</span>
                            </label>
                        </div>
                    </div>

                    {/* Formulario de Pago o Confirmación - SOLO después de elegir */}
                    <div className="border-t border-gray-200 pt-1 mt-1">
                        {!opcionPagoSeleccionada && (
                            <div className="text-center py-1 text-xs text-gray-500">
                                <p>Selecciona una forma de pago</p>
                            </div>
                        )}

                        {opcionPagoSeleccionada && !pagarAlLlegar && (
                            <>
                                <h4 className="mb-1 text-center text-xs font-bold text-gray-900">Formulario de Pago</h4>
                                <FormularioPago reservaData={prepararDatosReserva()}
                                                monto={monto}
                                                pagarAlLlegar={false}
                                                onPagoExitoso={(data) => {
                                                     const localizadorDelPago = data?.localizador || localizador;
                                setDatosReservaConfirmada({
                                    localizador: localizadorDelPago,
                                    nombre: formData.name,
                                    check_in: rango?.from,
                                    check_out: rango?.to,
                                    cantidad_habitaciones: getTotalHabitaciones(),
                                    precio_total: monto,
                                });
                                setMostrarModalConfirmacion(true);
                                // NO cerrar el drawer - el usuario debe ver el modal y cerrarlo manualmente
                            }}
                            onError={(mensaje) => { setErrorPago(mensaje);}}/>
                            </>
                        )}

                        {opcionPagoSeleccionada && pagarAlLlegar && (
                            <div className="text-center py-1">
                                <p className="text-gray-600 mb-1 text-xs">Pago en recepción.</p>
                                <button onClick={crearReservaAlLlegar} disabled={procesando}
                                    className="inline-flex items-center justify-center rounded bg-[#7a0202] px-3 py-1 font-semibold text-white text-xs hover:bg-[#6b0101] transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {procesando ? 'Creando...' : 'Confirmar'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-gray-200 mt-1 pt-0.5 bg-gris">
                <div className="flex items-center justify-between gap-1">
                    <button onClick={retrocederPaso} className="px-2 py-0.5 text-xs font-semibold text-gray-700 bg-gris rounded hover:bg-gray-300 transition">
                        Atrás
                    </button>
                </div>
                {errorPago && (
                    <div className="mt-0.5 rounded border border-red-200 bg-red-50 p-0.5 text-xs text-red-700">
                        {errorPago}
                    </div>
                )}
            </footer>

            <ModalConfirmacionReserva reserva={datosReservaConfirmada} isOpen={mostrarModalConfirmacion} onClose={handleResetearReserva} />
        </main>
    );
}
