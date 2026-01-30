import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import ModalConfirmacionReserva from '../modales/ModalConfirmacionReserva';
import DesgloseFactura from '../utilidades/DesgloseFactura';
import OpcionesPago from '../modales/OpcionesPago';
import useConfirmacionReserva from '@/hooks/reservas/useConfirmacionReserva';
import { calcularNoches, formatearMoneda } from '@/utils/formatters';

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

    // Cargar el precio del servidor cuando cambian fechas o habitaciones
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

                    // Usar el precio promedio del backend si está disponible
                    if (resultado.habitaciones && resultado.habitaciones.length > 0) {
                        const precioPromedio = resultado.habitaciones[0].precioAvg || 0;
                        setprecioAvg(precioPromedio);
                    } else {
                        setprecioAvg(0);
                    }
                } else {
                    // Si solo devuelve el total (número)
                    const montoCalculado = resultado;
                    setMonto(montoCalculado);

                    // Calcular precio promedio sin redondear a entero
                    const numeroNoches = calcularNoches(rango.from, rango.to);
                    const totalHabitaciones = getTotalHabitaciones() || 1;
                    const precioPorNocheUnaHabitacion = numeroNoches > 0
                        ? (montoCalculado / totalHabitaciones) / numeroNoches
                        : 0;
                    setprecioAvg(precioPorNocheUnaHabitacion);
                }
            } catch (error) {
                setMonto(0);
                setprecioAvg(0);
            }
        };

        cargarPrecio();
    }, [rango, Object.values(habitacionesSeleccionadas).map(h => h.cantidad).join()]);

    // Crear reserva para pago al llegar
    const crearReservaAlLlegar = async () => {
        try {
            const datosReserva = prepararDatosReserva(
                getValues,
                rango,
                habitacionesSeleccionadas,
                idClienteSeleccionado,
                tipoClienteSeleccionado,
                usuarioActual
            );

            const data = await crearReservaHook(datosReserva);

            // Mostrar modal de confirmación
            const datosConfirmacion = {
                localizador: data.localizador,
                nombre: formData.name,
                check_in: rango?.from,
                check_out: rango?.to,
                cantidad_habitaciones: getTotalHabitaciones(),
                // Preferir el precio calculado por el backend si está disponible
                precio_total: (data?.reserva?.precio_total !== undefined) ? data.reserva.precio_total : monto,
                pagoAlLlegar: true,
            };
            setDatosReservaConfirmada(datosConfirmacion);
            setTimeout(() => {
                setMostrarModalConfirmacion(true);
            }, 100);
        } catch (error) {
            setErrorPagoLocal(error.message || 'Error al crear la reserva');
        }
    };

    // Fallback: si el backend no devuelve tarifas_aplicadas, construirlas desde selectedTarifas + tarifasLookup
    const tarifasParaMostrar = () => {
        // Preferir lo que devolvió el backend en la última consulta
        if (ultimoResultadoPrecio && Array.isArray(ultimoResultadoPrecio.tarifas_aplicadas) && ultimoResultadoPrecio.tarifas_aplicadas.length > 0) {
            return ultimoResultadoPrecio.tarifas_aplicadas;
        }

        if (tarifasAplicadas && tarifasAplicadas.length > 0) return tarifasAplicadas;
        const ids = Object.keys(selectedTarifas || {}).filter(k => selectedTarifas[k]);
        return ids.map(id => tarifasLookup[id]).filter(Boolean);
    };

    const cargoParaMostrar = () => {
        if (ultimoResultadoPrecio && (ultimoResultadoPrecio.precioTarifas || ultimoResultadoPrecio.precioTarifas === 0)) {
            return ultimoResultadoPrecio.precioTarifas;
        }
        if (cargoTarifas && cargoTarifas > 0) return cargoTarifas;
        const list = tarifasParaMostrar();
        const numeroNoches = calcularNoches(rango?.from, rango?.to) || 1;
        return list.reduce((s, t) => {
            const mod = Number(t?.modificador_precio || 0);
            const isMedia = (t?.slug && t.slug.toLowerCase().includes('media')) || (t?.nombre && t.nombre.toLowerCase().includes('media'));
            return s + (isMedia ? mod * numeroNoches : mod);
        }, 0);
    };

    const handleCerrarDrawer = () => {
        const checkbox = document.getElementById('drawer-toggle');
        if (checkbox) {
            checkbox.checked = false;
        }
    };

    const handleResetearReserva = () => {
        // debug log removed
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

        // Resetear errores
        setErrorPagoLocal(null);

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
        <nav aria-label="Progreso de reserva" className="mx-auto flex max-w-xs justify-center items-center gap-2 text-xs">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <div key={i} className="flex items-center gap-2">
                    {i === 3 && <span className="text-[#7a0202] font-bold">›</span>}
                    <span className={`${i === 3 ? 'font-bold text-[#7a0202]' : 'text-gray-400'} text-[11px]`}>{etiqueta}</span>
                    {i < 3 && <span className="text-gray-300 text-xs">›</span>}
                </div>
            ))}
        </nav>
    );

    return (
        <main className="flex h-full flex-col bg-gris p-1 md:p-1.5 text-[12px] md:text-[13px]">
            <header className="mb-0 border-b border-gray-200 pb-0 pt-1">
                <h3 className="mb-0 text-center text-[13px] font-bold text-gray-900">Confirmación de Reserva</h3>
                <Migitas />
            </header>

            <section className="flex-1 overflow-hidden">
                <div className="space-y-1">
                    {/* Resumen */}
                    <div className="bg-gris rounded-lg p-3 mt-3 md:p-2">
                        <div className="space-y-1">
                            {/* Número de reserva */}
                            {localizador && (
                                <div className="pb-0.5">
                                    <p className="text-[11px] md:text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0">Localizador</p>
                                    <p className="font-mono font-bold text-[#7a0202] text-sm md:text-base tracking-wide">{localizador}</p>
                                </div>
                            )}

                            {/* Información de la reserva */}
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-0.5 w-full">
                                {/* Huésped */}
                                <div className="px-0.5 md:px-1 text-center">
                                    <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Huésped</p>
                                    <p className="text-[11px] md:text-[12px] font-medium text-gray-900 line-clamp-1">{formData.name}</p>
                                </div>

                                {/* Fechas */}
                                <div className="px-1 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Fechas</p>
                                    <p className="text-[12px] font-medium text-gray-900">{rango?.from?.toLocaleDateString('es-ES')} - {rango?.to?.toLocaleDateString('es-ES')}</p>
                                </div>

                                {/* Estancia */}
                                <div className="px-1 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Estancia</p>
                                    <p className="text-[12px] font-medium text-gray-900">
                                        {(() => {
                                            const numeroNoches = calcularNoches(rango?.from, rango?.to);
                                            return `${numeroNoches} noche${numeroNoches !== 1 ? 's' : ''}`;
                                        })()}
                                    </p>
                                </div>

                                {/* Precio por Noche */}
                                <div className="px-1 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Precio/Noche</p>
                                    <p className="text-[12px] font-medium text-gray-900">
                                        {precioAvg > 0 ? formatearMoneda(precioAvg) : '—'}
                                    </p>
                                </div>

                                {/* Habitaciones */}
                                <div className="px-1 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Habitaciones</p>
                                    <div className="space-y-0.5">
                                        {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                                <div key={tipo} className="text-[11px]">
                                                <p className="font-medium text-gray-900 leading-none">{r.cantidad}x {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Monto a Pagar */}
                            <DesgloseFactura habitacionesSeleccionadas={habitacionesSeleccionadas}
                                rango={rango} monto={monto} getTotalHabitaciones={getTotalHabitaciones}
                                agruparHabitacionesPorTipo={agruparHabitacionesPorTipo}
                                tarifasAplicadas={tarifasParaMostrar()} cargoTarifas={cargoParaMostrar()} />
                        </div>
                    </div>
                    {/* Opciones de Pago */}
                    <OpcionesPago
                        pagarAlLlegar={pagarAlLlegar}
                        setPagarAlLlegar={setPagarAlLlegar}
                        opcionPagoSeleccionada={opcionPagoSeleccionada}
                        setOpcionPagoSeleccionada={setOpcionPagoSeleccionada}
                        procesando={procesando}
                        crearReservaAlLlegar={crearReservaAlLlegar}
                        prepararDatosReserva={() =>
                            prepararDatosReserva(
                                getValues,
                                rango,
                                habitacionesSeleccionadas,
                                idClienteSeleccionado,
                                tipoClienteSeleccionado,
                                usuarioActual
                            )
                        }
                        monto={monto}
                        rango={rango}
                        getTotalHabitaciones={getTotalHabitaciones}
                        formData={formData}
                        localizador={localizador}
                        setDatosReservaConfirmada={setDatosReservaConfirmada}
                        setMostrarModalConfirmacion={setMostrarModalConfirmacion}
                        setErrorPago={setErrorPagoLocal}
                        errorPago={errorPagoLocal}
                    />
                </div>
            </section>

            <footer className="border-t border-gray-200 mt-0.5 pt-0.5 bg-gris px-1.5 md:px-2">
                <div className="flex items-center justify-between gap-1">
                    <button onClick={retrocederPaso} className="px-1.5 py-0.5 text-xs font-semibold text-gray-700 bg-gris rounded hover:bg-gray-300 transition">
                        Atrás
                    </button>
                </div>
            </footer>

            <ModalConfirmacionReserva reserva={datosReservaConfirmada} isOpen={mostrarModalConfirmacion} onClose={handleResetearReserva} />
        </main>
    );
}
