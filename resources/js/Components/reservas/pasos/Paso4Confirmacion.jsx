import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import ModalConfirmacionReserva from '../modales/ModalConfirmacionReserva';
import DesgloseFactura from '../utilidades/DesgloseFactura';
import OpcionesPago from '../modales/OpcionesPago';
import useConfirmacionReserva from '@/hooks/reservas/useConfirmacionReserva';
import { calcularNoches, formatearMoneda } from '@/utils/formatters';
import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';
import {
    CheckBadgeIcon,
    CalendarDaysIcon,
    UserIcon,
    HomeModernIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

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
    const [precioAvg, setprecioAvg] = useState(0);
    const [errorPagoLocal, setErrorPagoLocal] = useState(null);

    // Lógica de carga de precios sincronizada con la selección
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

    const crearReservaAlLlegar = async () => {
        try {
            const datosReserva = prepararDatosReserva(getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual);
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
            setErrorPagoLocal(error.message || 'Error al crear la reserva');
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
        /* Contenedor principal ensanchado a 6xl para evitar el apelotonamiento */
        <div className="relative z-10 mx-auto flex bg-gris h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 sishadow-2xl">

            {/* HEADER: Estilo Industrial Step 04 */}
            <header className="flex-none border-b border-gray-100 bg-gris px-8 py-6 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-black leading-none text-gray-900 uppercase tracking-tighter">
                            RESUMEN DE <span className="text-[#7a0202]">RESERVA</span>
                        </h1>
                        <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                            Verificación y Pago / Step 04
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

                                <div className="bg-gris p-2">
                                    <p className="text-sm font-black text-gray-900">
                                        FECHAS: {rango?.from?.toLocaleDateString('es-ES')} — {rango?.to?.toLocaleDateString('es-ES')}
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
                                    theme="dark"
                                />
                                <div className="space-y-4">
                                    {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                        <div key={tipo} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-black uppercase text-gray-900 tracking-tight">
                                                    <span className="text-[#7a0202] mr-3">{r.cantidad}x</span> {tipo}
                                                </span>
                                            </div>
                                            <span className="text-[12px] font-mono font-bold text-gray-400">
                                                {formatearMoneda(precioAvg)} / noche
                                            </span>
                                        </div>
                                    ))}
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
                                    prepararDatosReserva={() => prepararDatosReserva(getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual)}
                                    monto={monto}
                                    errorPago={errorPagoLocal}
                                    formData={formData}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </main>

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
