import Modal from '@/Components/Modal';
import ReservaBreadcrumbs from '@/Components/reservas/utilidades/ReservaBreadcrumbs';
import Boton from '@/Components/UI/Boton';
import useConfirmacionReserva from '@/hooks/reservas/useConfirmacionReserva';
import { ArrowLeftIcon, CheckBadgeIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../../../../css/paso4Confirmacion.css';
import ModalConfirmacionReserva from '@/Components/reservas/modales/ModalConfirmacionReserva';
import OpcionesPago from '@/Components/reservas/modales/OpcionesPago';
import { emitToast } from '@/utils/toast';
import DesgloseFactura from '@/Components/reservas/utilidades/DesgloseFactura';

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
    const {
        procesando,
        prepararDatosReserva,
        crearReservaAlLlegar: crearReservaHook,
    } = useConfirmacionReserva();

    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);
    const [pagarAlLlegar, setPagarAlLlegar] = useState(false);
    const [opcionPagoSeleccionada, setOpcionPagoSeleccionada] = useState(true);
    const [monto, setMonto] = useState(0);
    const [tarifasAplicadas, setTarifasAplicadas] = useState([]);
    const [cargoTarifas, setCargoTarifas] = useState(0);
    const [errorPagoLocal, setErrorPagoLocal] = useState(null);
    const [cuponDescuento, setCuponDescuento] = useState('');
    const [cuponValido, setCuponValido] = useState(null);
    const [clienteExistenteModal, setClienteExistenteModal] = useState(null);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const datosReservaRef = useRef(null);
    const fechasRef = useRef(null);
    const [highlightFechas, setHighlightFechas] = useState(false);

    useEffect(() => {
        const cargarPrecio = async () => {
            if (!rango?.from || !rango?.to) {
                setMonto(0);
                return;
            }
            try {
                const resultado = await precioSinTarifas();
                if (typeof resultado === 'object' && resultado.total !== undefined) {
                    setMonto(resultado.total);
                    setTarifasAplicadas(resultado.tarifas_aplicadas || []);
                    setCargoTarifas(resultado.precioTarifas || 0);
                } else {
                    setMonto(resultado);
                }
            } catch (error) {
                setMonto(0);
            }
        };
        cargarPrecio();
    }, [rango, Object.values(habitacionesSeleccionadas).map((h) => h.cantidad).join()]);

    useEffect(() => {
        const handler = () => {
            if (fechasRef.current) {
                fechasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightFechas(true);
                setTimeout(() => setHighlightFechas(false), 1200);
            }
        };
        window.addEventListener('faltanFechas', handler);
        return () => window.removeEventListener('faltanFechas', handler);
    }, []);

    const crearReservaAlLlegar = async () => {
        try {
            const datosReserva = prepararDatosReserva({
                getValues,
                rango,
                habitacionesSeleccionadas,
                idClienteSeleccionado,
                tipoClienteSeleccionado,
                usuarioActual,
                tarifasSeleccionadas: selectedTarifas,
                cupon_id: cuponValido?.cupon_id,
            });
            const data = await crearReservaHook(datosReserva);
            const datosConfirmacion = {
                localizador: data.localizador,
                nombre: formData.name,
                check_in: rango?.from,
                check_out: rango?.to,
                cantidad_habitaciones: getTotalHabitaciones(),
                precio_total: data?.reserva?.precio_total ?? monto,
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

    const aplicarCupon = async () => {
        if (!cuponDescuento.trim()) {
            setErrorPagoLocal('Ingresa un código');
            return;
        }
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const { data: result } = await axios.post('/cupones/validar', {
                codigo: cuponDescuento,
                email: formData.email,
                precio_total: monto,
            }, { headers: { 'X-CSRF-TOKEN': csrf } });

            if (result.success) {
                setCuponValido(result);
                setErrorPagoLocal(null);
                setMonto(result.precio_final);
            } else {
                setErrorPagoLocal(result.error || 'Código inválido');
                setCuponValido(null);
            }
        } catch (error) {
            emitToast('Error validando cupón', 'error');
            setCuponValido(null);
        }
    };

    const handleResetearReserva = () => {
        setMostrarModalConfirmacion(false);
        setPasoActual(1);
        setTimeout(() => window.location.reload(), 500);
    };

    const tarifasParaMostrar = () => {
        if (ultimoResultadoPrecio?.tarifas_aplicadas?.length > 0) return ultimoResultadoPrecio.tarifas_aplicadas;
        if (tarifasAplicadas?.length > 0) return tarifasAplicadas;
        return Object.keys(selectedTarifas).filter((k) => selectedTarifas[k]).map((id) => tarifasLookup[id]).filter(Boolean);
    };

    const cargoParaMostrar = () => {
        if (ultimoResultadoPrecio?.precioTarifas !== undefined) return ultimoResultadoPrecio.precioTarifas;
        if (cargoTarifas > 0) return cargoTarifas;
        return 0;
    };

    const retryCrearReservaConExisting = async () => {
        if (!datosReservaRef.current || !clienteExistenteModal) return;
    };

    const vinoColor = '[#7a0202]';
    const vinoBorder = '[#5a0101]';

    return (
        <div className={`flex min-h-0 max-h-[92vh] md:max-h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-2xl`}>
            <header className={`flex-none border-b border-${vinoBorder} bg-${vinoColor} px-4 py-4 sm:px-8 sm:py-6 shadow-md`}>
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                            Confirmación de Reserva
                        </h1>
                        <p className="text-sm font-medium text-zinc-200">
                            Paso 4: Verifique los detalles y proceda al pago
                        </p>
                    </div>
                    <ReservaBreadcrumbs activeIndex={3} className="text-zinc-200" />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8 pb-36 md:pb-8">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-5">
                        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className={`border-b border-${vinoBorder} bg-${vinoColor} px-5 py-4`}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                    <CheckBadgeIcon className="h-5 w-5 text-zinc-100" /> Detalles de la Estancia
                                </h3>
                            </div>

                            <div className="p-4 space-y-4">
                                {localizador && (
                                    <div className={`flex items-center justify-between rounded-lg bg-${vinoColor}/10 px-4 py-3 border border-${vinoColor}/20`}>
                                        <span className={`text-[11px] font-black uppercase text-${vinoColor} tracking-wider`}>Localizador</span>
                                        <span className={`font-mono text-xl font-black text-${vinoColor} tracking-widest`}>{localizador}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6 border-b border-zinc-100 pb-5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 block">Titular Principal</label>
                                        <p className="text-sm font-bold text-zinc-900 truncate">{formData.name || '—'}</p>
                                        <p className="text-xs text-zinc-500 truncate">{formData.email}</p>
                                    </div>
                                    <div ref={fechasRef} className={`transition-all duration-500 rounded-md p-2 -m-2 ${highlightFechas ? `bg-${vinoColor}/5 ring-2 ring-${vinoColor}` : ''}`}>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 block">Fechas de Estancia</label>
                                        <p className="text-sm font-bold text-zinc-900">
                                            {rango?.from?.toLocaleDateString()} <span className="text-zinc-400 mx-1">→</span> {rango?.to?.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <DesgloseFactura
                                    habitacionesSeleccionadas={habitacionesSeleccionadas}
                                    rango={rango}
                                    monto={monto}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                    agruparHabitacionesPorTipo={agruparHabitacionesPorTipo}
                                    tarifasAplicadas={tarifasParaMostrar()}
                                    cargoTarifas={cargoParaMostrar()}
                                    preciosPorTipo={preciosPorTipo}
                                    theme="light"
                                />
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-7">
                        <section className="h-full rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                            <div className={`border-b border-${vinoBorder} bg-${vinoColor} px-5 py-4`}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                    <CreditCardIcon className="h-5 w-5 text-zinc-100" /> Método de Pago y Finalización
                                </h3>
                            </div>
                            <div className="p-3 lg:p-5">
                                <OpcionesPago
                                    pagarAlLlegar={pagarAlLlegar}
                                    setPagarAlLlegar={setPagarAlLlegar}
                                    opcionPagoSeleccionada={opcionPagoSeleccionada}
                                    setOpcionPagoSeleccionada={setOpcionPagoSeleccionada}
                                    procesando={procesando}
                                    crearReservaAlLlegar={crearReservaAlLlegar}
                                    prepararDatosReserva={() => prepararDatosReserva({
                                        getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual, tarifasSeleccionadas: selectedTarifas
                                    })}
                                    rango={rango}
                                    monto={monto}
                                    errorPago={errorPagoLocal}
                                    setErrorPago={setErrorPagoLocal}
                                    setPasoActual={setPasoActual}
                                    formData={formData}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                    cuponDescuento={cuponDescuento}
                                    setCuponDescuento={setCuponDescuento}
                                    aplicarCupon={aplicarCupon}
                                    cuponValido={cuponValido}
                                />
                            </div>
                        </section>
                    </div>
                </div>
                <div className="md:hidden h-36" aria-hidden="true" />
            </main>

            <footer className="flex-none border-t border-zinc-200 bg-white px-8 py-5">
                <div className="flex items-center justify-start">
                    <Boton
                        variant="ghost"
                        size="sm"
                        className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                        icon={ArrowLeftIcon}
                        onClick={retrocederPaso}
                    >
                        Volver y editar datos
                    </Boton>
                </div>
            </footer>

            <ModalConfirmacionReserva
                reserva={datosReservaConfirmada}
                isOpen={mostrarModalConfirmacion}
                onClose={handleResetearReserva}
            />

             <Modal show={showClienteModal} onClose={() => setShowClienteModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className={`mb-4 flex items-center gap-3 text-${vinoColor}`}>
                         <div className={`rounded-full bg-${vinoColor}/10 p-2`}>
                             <CheckBadgeIcon className="h-6 w-6" />
                         </div>
                        <h3 className="text-lg font-black">Cliente Existente Detectado</h3>
                    </div>

                    <p className="mb-6 text-sm text-gray-600">
                        El documento de identidad ingresado coincide con un cliente ya registrado en nuestra base de datos.
                    </p>

                    {clienteExistenteModal && (
                         <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                             <p className="font-bold text-zinc-900">{clienteExistenteModal.name}</p>
                             <p className="text-xs text-zinc-600 mb-1">{clienteExistenteModal.email}</p>
                             <p className="text-xs font-mono text-zinc-500">DNI: {clienteExistenteModal.numero_documento}</p>
                         </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Boton variant="secondary" onClick={() => setShowClienteModal(false)}>Cancelar y Corregir</Boton>
                        <Boton onClick={retryCrearReservaConExisting} className={`bg-${vinoColor} hover:bg-${vinoColor}/90 text-white border-transparent`}>
                            Confirmar con este Cliente
                        </Boton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
