import { useState, useEffect, useRef } from 'react';
import ModalConfirmacionReserva from '../modales/ModalConfirmacionReserva';
import DesgloseFactura from '../utilidades/DesgloseFactura';
import Modal from '@/Components/Modal';
import OpcionesPago from '../modales/OpcionesPago';
import CuponDescuento from '@/Components/reservas/CuponDescuento';
import useConfirmacionReserva from '@/hooks/reservas/useConfirmacionReserva';
import { calcularNoches, formatearMoneda } from '@/utils/formatters';
import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Paso4Confirmacion({
    rango,
    watch,
    habitacionesSeleccionadas,
    getTotalHabitaciones,
    retrocederPaso,
    precioSinTarifas,
    usuarioActual,
    getValues,
    idClienteSeleccionado,
    tipoClienteSeleccionado,
    localizador,
    setPasoActual,
    limpiarRango,
    setValue,
    actualizarSeleccionHabitacion,
    agruparHabitacionesPorTipo,
    preciosPorTipo = {},
    selectedTarifas = {},
    tarifasLookup = {},
    ultimoResultadoPrecio = null,
}) {
    const formData = watch();
    const { procesando, prepararDatosReserva, crearReservaAlLlegar: crearReservaHook } = useConfirmacionReserva();
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);
    const [pagarAlLlegar, setPagarAlLlegar] = useState(false);
    const [opcionPagoSeleccionada, setOpcionPagoSeleccionada] = useState(true);
    const [monto, setMonto] = useState(0);
    const [tarifasAplicadas, setTarifasAplicadas] = useState([]);
    const [cargoTarifas, setCargoTarifas] = useState(0);
    const [precioAvg, setprecioAvg] = useState(0);
    const [errorPagoLocal, setErrorPagoLocal] = useState(null);
    const [cuponDescuento, setCuponDescuento] = useState('');
    const [descuentoAplicado, setDescuentoAplicado] = useState(0);
    const [cuponValido, setCuponValido] = useState(null);
    const [clienteExistenteModal, setClienteExistenteModal] = useState(null);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const datosReservaRef = useRef(null);
    const fechasRef = useRef(null);
    const [highlightFechas, setHighlightFechas] = useState(false);

    useEffect(() => {
        console.log('Paso4 - selectedTarifas recibido:', selectedTarifas);
    }, [selectedTarifas]);

    useEffect(() => {
        const cargarPrecio = async () => {
            if (!rango?.from || !rango?.to) {
                setMonto(0);
                setprecioAvg(0);
                return;
            }
            try {
                const resultado = await precioSinTarifas();
                if (typeof resultado === 'object' && resultado.total !== undefined) {
                    setMonto(resultado.total);
                    setTarifasAplicadas(resultado.tarifas_aplicadas || []);
                    setCargoTarifas(resultado.precioTarifas || 0);
                    if (resultado.habitaciones && resultado.habitaciones.length > 0) {
                        setprecioAvg(resultado.habitaciones[0].precioAvg || 0);
                    }
                } else {
                    const montoCalculado = resultado;
                    setMonto(montoCalculado);
                    const numeroNoches = calcularNoches(rango.from, rango.to);
                    const totalHab = getTotalHabitaciones() || 1;
                    setprecioAvg(numeroNoches > 0 ? (montoCalculado / totalHab) / numeroNoches : 0);
                }
            } catch (error) {
                setMonto(0);
                setprecioAvg(0);
            }
        };
        cargarPrecio();
    }, [rango, Object.values(habitacionesSeleccionadas).map(h => h.cantidad).join()]);

    // Listener para eventos de falta de fechas (mejora UX)
    useEffect(() => {
        const handler = () => {
            try {
                if (fechasRef.current) {
                    fechasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightFechas(true);
                    setTimeout(() => setHighlightFechas(false), 1200);
                } else {
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                }
            } catch (e) { /* noop */ }
        };
        window.addEventListener('faltanFechas', handler);
        return () => window.removeEventListener('faltanFechas', handler);
    }, [fechasRef.current]);

    const crearReservaAlLlegar = async () => {
        try {
            console.log('📤 Enviando tarifas a backend:', selectedTarifas);
            const datosReserva = prepararDatosReserva({ getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual, tarifasSeleccionadas: selectedTarifas });
            console.log('📄 Payload tarifas:', datosReserva.tarifas);
            const data = await crearReservaHook(datosReserva);
            const datosConfirmacion = {
                localizador: data.localizador,
                nombre: formData.name,
                check_in: rango?.from,
                check_out: rango?.to,
                cantidad_habitaciones: getTotalHabitaciones(),
                precio_total: (data?.reserva?.precio_total !== undefined) ? data.reserva.precio_total : monto,
                pagoAlLlegar: true,
            };
            setDatosReservaConfirmada(datosConfirmacion);
            setTimeout(() => setMostrarModalConfirmacion(true), 100);
        } catch (error) {
            if (error?.status === 409 && error?.cliente_existente) {
                setClienteExistenteModal(error.cliente_existente);
                setShowClienteModal(true);
            } else {
                setErrorPagoLocal(error.message || 'Error al crear la reserva');
            }
        }
    };

    const handleResetearReserva = () => {
        setMostrarModalConfirmacion(false);
        setDatosReservaConfirmada(null);
        setValue('name', '');
        limpiarRango();
        Object.keys(habitacionesSeleccionadas).forEach(tipo => actualizarSeleccionHabitacion(tipo, 0, 0));
        setPasoActual(1);
        setTimeout(() => window.location.reload(), 500);
    };

    const tarifasParaMostrar = () => {
        if (ultimoResultadoPrecio?.tarifas_aplicadas?.length > 0) return ultimoResultadoPrecio.tarifas_aplicadas;
        if (tarifasAplicadas?.length > 0) return tarifasAplicadas;
        return Object.keys(selectedTarifas).filter(k => selectedTarifas[k]).map(id => tarifasLookup[id]).filter(Boolean);
    };

    const retryCrearReservaConExisting = async () => {
        if (!datosReservaRef.current || !clienteExistenteModal) return;
        try {
            const datos = { ...datosReservaRef.current, reservable_id: clienteExistenteModal.id };
            const data = await crearReservaHook(datos);
            const datosConfirmacion = {
                localizador: data.localizador,
                nombre: formData.name,
                check_in: rango?.from,
                check_out: rango?.to,
                cantidad_habitaciones: getTotalHabitaciones(),
                precio_total: (data?.reserva?.precio_total !== undefined) ? data.reserva.precio_total : monto,
                pagoAlLlegar: true,
            };
            setDatosReservaConfirmada(datosConfirmacion);
            setTimeout(() => setMostrarModalConfirmacion(true), 100);
            setShowClienteModal(false);
            setClienteExistenteModal(null);
        } catch (err) {
            setErrorPagoLocal(err?.message || 'Error procesando reserva');
        }
    };


    const cargoParaMostrar = () => {
        if (ultimoResultadoPrecio && (ultimoResultadoPrecio.precioTarifas || ultimoResultadoPrecio.precioTarifas === 0)) {
            return ultimoResultadoPrecio.precioTarifas;
        }
        if (cargoTarifas && cargoTarifas > 0) return cargoTarifas;
        const list = tarifasParaMostrar();
        const nNoches = calcularNoches(rango?.from, rango?.to) || 1;
        return list.reduce((s, t) => {
            const mod = Number(t?.modificador_precio || 0);
            const isMedia = (t?.slug?.toLowerCase().includes('media')) || (t?.nombre?.toLowerCase().includes('media'));
            return s + (isMedia ? mod * nNoches : mod);
        }, 0);
    };

    return (
        <div className="relative z-10 mx-auto flex bg-gris h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 sishadow-2xl">
            <header className="flex-none border-b border-gray-100 bg-gris px-8 py-6 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-black leading-none text-gray-900 uppercase tracking-tighter">RESUMEN</h1>
                        <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                            Finalizando tu reserva  04 / 04
                        </p>
                    </div>
                    <ReservaBreadcrumbs activeIndex={3} separator="chevron" className="flex items-center gap-3" textClass="text-[10px]" />
                </div>
            </header>

            {/* CUERPO: Grid de 12 columnas para maximizar el espacio */}
            <main className="flex-1 overflow-hidden bg-gris flex flex-col items-center justify-start">
                <div className="custom-scrollbar w-full max-w-full overflow-y-auto px-6 md:px-12 py-8">

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* COLUMNA DETALLES: 5/12 del ancho total */}
                        <div className="lg:col-span-5 space-y-8">

                            {localizador && (
                                <div className="bg-gris p-5 rounded-lg flex justify-between items-center shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Localizador</span>
                                    <span className="font-mono font-bold text-[#7a0202] text-xl tracking-wider">{localizador}</span>
                                </div>
                            )}

                            {/* Fichas de Información con acento lateral */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-2">
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{formData.name || '—'}</p>
                                    <p className="text-[11px] text-gray-500 mt-1 font-medium">{formData.email}</p>
                                </div>

                                <div ref={fechasRef} className={`bg-gris p-2 ${highlightFechas ? 'ring-2 ring-red-500 rounded-md animate-pulse' : ''}`}>
                                    <p className="text-sm font-black text-gray-900">
                                        {rango?.from?.toLocaleDateString('es-ES')} — {rango?.to?.toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                            </div>
                            {/* Detalle de Unidades */}
                            <div className="p-4 bg-gris shadow-sm w-full max-w-sm mx-auto">
                                <DesgloseFactura
                                    habitacionesSeleccionadas={habitacionesSeleccionadas}
                                    rango={rango}
                                    monto={monto}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                    agruparHabitacionesPorTipo={agruparHabitacionesPorTipo}
                                    tarifasAplicadas={tarifasParaMostrar()}
                                    cargoTarifas={cargoParaMostrar()}
                                    ultimoResultadoPrecio={ultimoResultadoPrecio}
                                    preciosPorTipo={preciosPorTipo}
                                    theme="dark"
                                />


                            <div className="mt-3">
                                <CuponDescuento
                                    value={cuponDescuento}
                                    onChange={(e) => setCuponDescuento(e.target.value)}
                                    onApply={() => {
                                        if (typeof window !== 'undefined') {
                                            window.dispatchEvent(new CustomEvent('codigoEspecialAplicar', { detail: { codigo: cuponDescuento } }));
                                        }
                                        return true;
                                    }}
                                />
                            </div>
                            </div>
                        </div>

                        {/* COLUMNA PAGO: 7/12 del ancho total */}
                        <div className="lg:col-span-7 space-y-8">
                            {/* Componente de Opciones de Pago con el formulario corregido */}
                            <div className="px-2">
                                <OpcionesPago
                                    pagarAlLlegar={pagarAlLlegar}
                                    setPagarAlLlegar={setPagarAlLlegar}
                                    opcionPagoSeleccionada={opcionPagoSeleccionada}
                                    setOpcionPagoSeleccionada={setOpcionPagoSeleccionada}
                                    procesando={procesando}
                                    crearReservaAlLlegar={crearReservaAlLlegar}
                                    prepararDatosReserva={() => prepararDatosReserva({ getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual, tarifasSeleccionadas: selectedTarifas })}
                                    rango={rango}
                                    monto={monto}
                                    errorPago={errorPagoLocal}
                                    setDatosReservaConfirmada={setDatosReservaConfirmada}
                                    setMostrarModalConfirmacion={setMostrarModalConfirmacion}
                                    setErrorPago={setErrorPagoLocal}
                                    setPasoActual={setPasoActual}
                                    formData={formData}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                    localizador={localizador}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Modal: Cliente existente en pago en recepción */}
            <Modal show={Boolean(showClienteModal)} onClose={() => setShowClienteModal(false)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-black text-gray-900 mb-2">Cliente existente detectado</h3>
                    <p className="text-[12px] text-gray-600 mb-4">El DNI ya está registrado con otro cliente. ¿Quieres usar ese cliente para esta reserva?</p>
                    {clienteExistenteModal && (
                        <div className="bg-gray-50 p-4 rounded mb-4">
                            <p className="font-bold">{clienteExistenteModal.name}</p>
                            <p className="text-sm text-gray-600">{clienteExistenteModal.email}</p>
                            <p className="text-sm text-gray-600">DNI: {clienteExistenteModal.numero_documento}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowClienteModal(false)} className="py-2 px-4 rounded bg-white border border-gray-200">Cancelar</button>
                        <button onClick={retryCrearReservaConExisting} className="py-2 px-4 rounded bg-[#7a0202] text-white font-bold">Usar este cliente</button>
                    </div>
                </div>
            </Modal>

            {/* FOOTER: Navegación final */}
            <footer className="flex-none border-t border-gray-100 bg-white px-10 py-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button onClick={retrocederPaso} className="flex items-center gap-2 text-[10px] font-black text-gray-400 transition-colors uppercase tracking-[0.2em] hover:text-[#7a0202]">
                        <ArrowLeftIcon className="h-3 w-3" /> Editar Datos del Titular
                    </button>
                </div>
            </footer>

            <ModalConfirmacionReserva reserva={datosReservaConfirmada} isOpen={mostrarModalConfirmacion} onClose={handleResetearReserva}/>
        </div>
    );
}
