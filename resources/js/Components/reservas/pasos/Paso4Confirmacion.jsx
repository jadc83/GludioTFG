import Modal from '@/Components/Modal';
import CuponDescuento from '@/Components/reservas/CuponDescuento';
import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';
import Boton from '@/Components/UI/Boton';
import useConfirmacionReserva from '@/hooks/reservas/useConfirmacionReserva';
import { calcularNoches } from '@/utils/formatters';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import ModalConfirmacionReserva from '../modales/ModalConfirmacionReserva';
import OpcionesPago from '../modales/OpcionesPago';
import DesgloseFactura from '../utilidades/DesgloseFactura';
import '../../../../css/paso4Confirmacion.css';

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
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] =
        useState(false);
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
        console.log('Paso4 - selectedTarifas recibido:', selectedTarifas);
    }, [selectedTarifas]);

    useEffect(() => {
        const cargarPrecio = async () => {
            if (!rango?.from || !rango?.to) {
                setMonto(0);
                return;
            }
            try {
                const resultado = await precioSinTarifas();
                if (
                    typeof resultado === 'object' &&
                    resultado.total !== undefined
                ) {
                    setMonto(resultado.total);
                    setTarifasAplicadas(resultado.tarifas_aplicadas || []);
                    setCargoTarifas(resultado.precioTarifas || 0);
                    if (
                        resultado.habitaciones &&
                        resultado.habitaciones.length > 0
                    ) {
                    }
                } else {
                    const montoCalculado = resultado;
                    setMonto(montoCalculado);
                }
            } catch (error) {
                setMonto(0);
                setprecioAvg(0);
            }
        };
        cargarPrecio();
    }, [
        rango,
        Object.values(habitacionesSeleccionadas)
            .map((h) => h.cantidad)
            .join(),
    ]);

    // Listener para eventos de falta de fechas (mejora UX)
    useEffect(() => {
        const handler = () => {
            try {
                if (fechasRef.current) {
                    fechasRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    setHighlightFechas(true);
                    setTimeout(() => setHighlightFechas(false), 1200);
                } else {
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                }
            } catch (e) {
                /* noop */
            }
        };
        window.addEventListener('faltanFechas', handler);
        return () => window.removeEventListener('faltanFechas', handler);
    }, [fechasRef.current]);

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
                precio_total:
                    data?.reserva?.precio_total !== undefined
                        ? data.reserva.precio_total
                        : monto,
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
            const response = await fetch('/cupones/validar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    codigo: cuponDescuento,
                    email: formData.email,
                    precio_total: monto,
                }),
            });

            if (response.status === 419) {
                setErrorPagoLocal('Sesión expirada, recarga la página');
                return;
            }

            const result = await response.json();

            if (result.success) {
                setCuponValido(result);
                setErrorPagoLocal(null);
                setMonto(result.precio_final);
            } else {
                setErrorPagoLocal(result.error || 'Código inválido');
                setCuponValido(null);
            }
        } catch (error) {
            setErrorPagoLocal('Error validando cupón');
            setCuponValido(null);
        }
    };

    const handleResetearReserva = () => {
        setMostrarModalConfirmacion(false);
        setDatosReservaConfirmada(null);
        setValue('name', '');
        limpiarRango();
        Object.keys(habitacionesSeleccionadas).forEach((tipo) =>
            actualizarSeleccionHabitacion(tipo, 0, 0),
        );
        setPasoActual(1);
        setTimeout(() => window.location.reload(), 500);
    };

    const tarifasParaMostrar = () => {
        if (ultimoResultadoPrecio?.tarifas_aplicadas?.length > 0)
            return ultimoResultadoPrecio.tarifas_aplicadas;
        if (tarifasAplicadas?.length > 0) return tarifasAplicadas;
        return Object.keys(selectedTarifas)
            .filter((k) => selectedTarifas[k])
            .map((id) => tarifasLookup[id])
            .filter(Boolean);
    };

    const retryCrearReservaConExisting = async () => {
        if (!datosReservaRef.current || !clienteExistenteModal) return;
        try {
            const datos = {
                ...datosReservaRef.current,
                reservable_id: clienteExistenteModal.id,
            };
            const data = await crearReservaHook(datos);
            const datosConfirmacion = {
                localizador: data.localizador,
                nombre: formData.name,
                check_in: rango?.from,
                check_out: rango?.to,
                cantidad_habitaciones: getTotalHabitaciones(),
                precio_total:
                    data?.reserva?.precio_total !== undefined
                        ? data.reserva.precio_total
                        : monto,
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
        if (
            ultimoResultadoPrecio &&
            (ultimoResultadoPrecio.precioTarifas ||
                ultimoResultadoPrecio.precioTarifas === 0)
        ) {
            return ultimoResultadoPrecio.precioTarifas;
        }
        if (cargoTarifas && cargoTarifas > 0) return cargoTarifas;
        const list = tarifasParaMostrar();
        const nNoches = calcularNoches(rango?.from, rango?.to) || 1;
        return list.reduce((s, t) => {
            const mod = Number(t?.modificador_precio || 0);
            const isMedia =
                t?.slug?.toLowerCase().includes('media') ||
                t?.nombre?.toLowerCase().includes('media');
            return s + (isMedia ? mod * nNoches : mod);
        }, 0);
    };

    return (
        <div className="paso4-confirmacion shadow-2xl relative z-10 mx-auto flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-gris">
            <header className="flex-none border-b border-gray-100 bg-gris px-6 py-5 md:px-10 md:py-6">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div className="text-center md:text-left">
                        <h1 className="text-xl font-black uppercase leading-none tracking-tighter text-gray-900 md:text-2xl">
                            RESUMEN
                        </h1>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                            Finalizando tu reserva 04 / 04
                        </p>
                    </div>
                    <ReservaBreadcrumbs
                        activeIndex={3}
                        separator="chevron"
                        className="flex items-center gap-3"
                        textClass="text-[10px]"
                    />
                </div>
            </header>

            {/* CUERPO: Grid de 12 columnas para maximizar el espacio */}
            <main className="flex flex-1 flex-col items-center justify-start overflow-hidden bg-gris">
                <div className="custom-scrollbar w-full max-w-full overflow-y-auto px-4 py-6 sm:px-6 md:px-10 md:py-8">
                    <div className="resumen-grid grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
                        {/* COLUMNA DETALLES: 5/12 del ancho total */}
                        <div className="col-detalle space-y-6 lg:col-span-5">
                            {localizador && (
                                <div className="flex items-center justify-between rounded-lg bg-gris p-5 shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Localizador
                                    </span>
                                    <span className="font-mono text-xl font-bold tracking-wider text-[#7a0202]">
                                        {localizador}
                                    </span>
                                </div>
                            )}

                            {/* Fichas de Información con acento lateral */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="p-2">
                                    <p className="text-sm font-black uppercase tracking-tight text-gray-900">
                                        {formData.name || '—'}
                                    </p>
                                    <p className="mt-1 text-[11px] font-medium text-gray-500">
                                        {formData.email}
                                    </p>
                                </div>

                                <div
                                    ref={fechasRef}
                                    className={`bg-gris p-2 ${highlightFechas ? 'animate-pulse rounded-md ring-2 ring-red-500' : ''}`}
                                >
                                    <p className="text-sm font-black text-gray-900">
                                        {rango?.from?.toLocaleDateString(
                                            'es-ES',
                                        )}{' '}
                                        —{' '}
                                        {rango?.to?.toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                            </div>
                            {/* Detalle de Unidades */}
                            <div className="mx-auto w-full max-w-sm bg-gris p-4 shadow-sm">
                                <DesgloseFactura
                                    habitacionesSeleccionadas={
                                        habitacionesSeleccionadas
                                    }
                                    rango={rango}
                                    monto={monto}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                    agruparHabitacionesPorTipo={
                                        agruparHabitacionesPorTipo
                                    }
                                    tarifasAplicadas={tarifasParaMostrar()}
                                    cargoTarifas={cargoParaMostrar()}
                                    ultimoResultadoPrecio={
                                        ultimoResultadoPrecio
                                    }
                                    preciosPorTipo={preciosPorTipo}
                                    theme="dark"
                                />

                                <div className="mt-3">
                                    <CuponDescuento
                                        value={cuponDescuento}
                                        onChange={(e) =>
                                            setCuponDescuento(e.target.value)
                                        }
                                        onApply={aplicarCupon}
                                    />
                                    {cuponValido && (
                                        <p className="mt-2 text-[10px] font-bold text-green-600">
                                            ✓ Descuento de €
                                            {cuponValido.descuento.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA PAGO: 7/12 del ancho total */}
                        <div className="col-pago space-y-6 lg:col-span-7">
                            {/* Componente de Opciones de Pago con el formulario corregido */}
                            <div className="px-2">
                                <OpcionesPago
                                    pagarAlLlegar={pagarAlLlegar}
                                    setPagarAlLlegar={setPagarAlLlegar}
                                    opcionPagoSeleccionada={
                                        opcionPagoSeleccionada
                                    }
                                    setOpcionPagoSeleccionada={
                                        setOpcionPagoSeleccionada
                                    }
                                    procesando={procesando}
                                    crearReservaAlLlegar={crearReservaAlLlegar}
                                    prepararDatosReserva={() =>
                                        prepararDatosReserva({
                                            getValues,
                                            rango,
                                            habitacionesSeleccionadas,
                                            idClienteSeleccionado,
                                            tipoClienteSeleccionado,
                                            usuarioActual,
                                            tarifasSeleccionadas:
                                                selectedTarifas,
                                        })
                                    }
                                    rango={rango}
                                    monto={monto}
                                    errorPago={errorPagoLocal}
                                    setDatosReservaConfirmada={
                                        setDatosReservaConfirmada
                                    }
                                    setMostrarModalConfirmacion={
                                        setMostrarModalConfirmacion
                                    }
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
            <Modal
                show={Boolean(showClienteModal)}
                onClose={() => setShowClienteModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-black text-gray-900">
                        Cliente existente detectado
                    </h3>
                    <p className="mb-4 text-[12px] text-gray-600">
                        El DNI ya está registrado con otro cliente. ¿Quieres
                        usar ese cliente para esta reserva?
                    </p>
                    {clienteExistenteModal && (
                        <div className="mb-4 rounded bg-gray-50 p-4">
                            <p className="font-bold">
                                {clienteExistenteModal.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                {clienteExistenteModal.email}
                            </p>
                            <p className="text-sm text-gray-600">
                                DNI: {clienteExistenteModal.numero_documento}
                            </p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowClienteModal(false)}
                            className="rounded border border-gray-200 bg-white px-4 py-2"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={retryCrearReservaConExisting}
                            className="rounded bg-[#7a0202] px-4 py-2 font-bold text-white"
                        >
                            Usar este cliente
                        </button>
                    </div>
                </div>
            </Modal>

            {/* FOOTER: Navegación final */}
            <footer className="flex-none border-t border-gray-100 bg-white px-6 py-5 md:px-10">
                <div className="footer-cta mx-auto flex max-w-5xl items-center justify-between">
                    <Boton
                        variant="ghost"
                        size="sm"
                        icon={ArrowLeftIcon}
                        onClick={retrocederPaso}
                    >
                        Editar Datos del Titular
                    </Boton>
                </div>
            </footer>

            <ModalConfirmacionReserva
                reserva={datosReservaConfirmada}
                isOpen={mostrarModalConfirmacion}
                onClose={handleResetearReserva}
            />
        </div>
    );
}
