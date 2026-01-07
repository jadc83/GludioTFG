import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import PrimaryButton from '../PrimaryButton';
import ModalConfirmacionReserva from './ModalConfirmacionReserva';
import DesgloseFactura from './DesgloseFactura';
import OpcionesPago from './OpcionesPago';
import useConfirmacionReserva from '../../hooks/useConfirmacionReserva';
import { calcularNoches, formatearMoneda } from '../../utils/formatters';

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
    agruparHabitacionesPorTipo,
}) {
    const formData = watch();
    const page = usePage();
    const {
        procesando,
        errorPago,
        prepararDatosReserva,
        crearReservaAlLlegar: crearReservaHook,
    } = useConfirmacionReserva();

    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);
    const [pagarAlLlegar, setPagarAlLlegar] = useState(false);
    const [opcionPagoSeleccionada, setOpcionPagoSeleccionada] = useState(true);
    const [monto, setMonto] = useState(0);
    const [precioPromedioPorNoche, setPrecioPromedioPorNoche] = useState(0);
    const [errorPagoLocal, setErrorPagoLocal] = useState(null);

    // Cargar el precio del servidor cuando cambian fechas o habitaciones
    useEffect(() => {
        const cargarPrecio = async () => {
            if (!rango?.from || !rango?.to) {
                setMonto(0);
                setPrecioPromedioPorNoche(0);
                return;
            }

            try {
                const montoCalculado = await calcularMontoTotal();
                setMonto(montoCalculado);

                // Calcular precio promedio por noche de UNA habitación
                // (monto total / número de habitaciones / número de noches)
                const numeroNoches = calcularNoches(rango.from, rango.to);
                const totalHabitaciones = getTotalHabitaciones() || 1;
                const precioPorNocheUnaHabitacion = numeroNoches > 0
                    ? Math.round((montoCalculado / totalHabitaciones) / numeroNoches)
                    : 0;
                setPrecioPromedioPorNoche(precioPorNocheUnaHabitacion);
            } catch (error) {
                console.error('Error al cargar precio:', error);
                setMonto(0);
                setPrecioPromedioPorNoche(0);
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
                precio_total: monto,
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
        <main className="flex h-full flex-col bg-gris p-2">
            <header className="mb-0.5 border-b border-gray-200 pb-0.5">
                <h3 className="mb-0 text-center text-xs font-bold text-gray-900">Confirmación de Reserva</h3>
                <Migitas />
            </header>

            <section className="flex-1 overflow-hidden">
                <div className="space-y-1">
                    {/* Resumen */}
                    <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Resumen de tu Reserva</h4>

                        <div className="space-y-1">
                            {/* Número de reserva */}
                            {localizador && (
                                <div className="pb-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0">Localizador</p>
                                    <p className="font-mono font-bold text-[#7a0202] text-sm tracking-wide">{localizador}</p>
                                </div>
                            )}

                            {/* Huésped, fechas y habitaciones */}
                            <div className="grid grid-cols-5 gap-0.5 w-full">
                                {/* Huésped */}
                                <div className="px-1 text-center">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Huésped</p>
                                    <p className="text-[11px] font-medium text-gray-900 line-clamp-1">{formData.name}</p>
                                </div>

                                {/* Estancia */}
                                <div className="px-1 text-center">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Estancia</p>
                                    <p className="text-[11px] font-medium text-gray-900">
                                        {(() => {
                                            const numeroNoches = calcularNoches(rango?.from, rango?.to);
                                            return `${numeroNoches} noche${numeroNoches !== 1 ? 's' : ''}`;
                                        })()}
                                    </p>
                                </div>

                                {/* Fechas */}
                                <div className="px-1 text-center">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Fechas</p>
                                    <p className="text-[11px] font-medium text-gray-900">{rango?.from?.toLocaleDateString('es-ES')} - {rango?.to?.toLocaleDateString('es-ES')}</p>
                                </div>

                                {/* Precio por Noche */}
                                <div className="px-1 text-center">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Precio/Noche</p>
                                    <p className="text-[11px] font-medium text-gray-900">
                                        {precioPromedioPorNoche > 0 ? formatearMoneda(precioPromedioPorNoche) : '—'}
                                    </p>
                                </div>

                                {/* Habitaciones */}
                                <div className="px-1 text-center">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Habitaciones</p>
                                    <div className="space-y-0.5">
                                        {Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0).map(([tipo, r]) => (
                                            <div key={tipo} className="text-[10px]">
                                                <p className="font-medium text-gray-900 leading-none">{r.cantidad}x {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
                                                <p className="text-[10px] text-gray-600 leading-none">{r.personas || 1}p</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Monto a Pagar */}
                            <DesgloseFactura
                                habitacionesSeleccionadas={habitacionesSeleccionadas}
                                rango={rango}
                                monto={monto}
                                getTotalHabitaciones={getTotalHabitaciones}
                                agruparHabitacionesPorTipo={agruparHabitacionesPorTipo}
                            />
                        </div>
                    </div>

                    {/* Opción de pago - PRIMERO elegir, LUEGO mostrar formulario */}
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

            <footer className="border-t border-gray-200 mt-0.5 pt-0.5 bg-gris">
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
