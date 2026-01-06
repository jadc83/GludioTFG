import useReservaForm from '../hooks/useReservaForm';
import Paso1Fechas from './reservas/Paso1Fechas';
import Paso2Habitaciones from './reservas/Paso2Habitaciones';
import Paso3Datos from './reservas/Paso3Datos';
import Paso4Confirmacion from './reservas/Paso4Confirmacion';
import PrimaryButton from './PrimaryButton';
import TypingAnimation from './TypingAnimation';
import { calcularPrecioDinamico, obtenerPrecioBase } from '../utils/precios';
import '../../css/createHabitacion.css';
import '../../css/estiloCalendario.css';
import '../../css/estiloMenuLateral.css';
import { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { usePage } from '@inertiajs/react';
import { CalendarIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function MenuLateral() {
    const hook = useReservaForm();
    const page = usePage();
    const esPanelControl = page.url?.includes('panel') || page.component === 'PanelControl';
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const [calendarioAbierto, setCalendarioAbierto] = useState(null); // 'entrada' o 'salida'
    const calendarioRef = useRef(null);

    // Cerrar calendario al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarioRef.current && !calendarioRef.current.contains(event.target)) {
                setCalendarioAbierto(null);
            }
        };

        if (calendarioAbierto) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [calendarioAbierto]);

    // Escuchar evento para abrir calendario desde Paso2
    useEffect(() => {
        const handleAbrirCalendario = (event) => {
            setCalendarioAbierto(event.detail);
        };

        window.addEventListener('abrirCalendario', handleAbrirCalendario);
        return () => {
            window.removeEventListener('abrirCalendario', handleAbrirCalendario);
        };
    }, []);



    const ErrorToast = ({ message }) => (
        <div className="toast toast-center toast-top z-50">
            <div className="alert alert-error shadow-lg">
                <span>{message}</span>
            </div>
        </div>
    );

    // Calcular noches
    const noches = hook.rango?.from && hook.rango?.to
        ? Math.ceil((new Date(hook.rango.to) - new Date(hook.rango.from)) / (1000 * 60 * 60 * 24))
        : 0;

    // Formatear fecha corta (DD/MM/YYYY)
    const formatearFechaCorta = (fecha) => {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Formatear fecha legible
    const formatearFechaLegible = (fecha) => {
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Manejar selección de rango
    const handleSeleccionRango = (nuevoRango) => {
        hook.setRango(nuevoRango);
        // No cerrar el calendario automáticamente para que pueda ajustar
    };

    const montoTotal = hook.calcularMontoTotal ? hook.calcularMontoTotal() : 0;

    // Formatear día con nombre completo
    const formatearNombreDia = (date) => {
        return date.toLocaleDateString('es-ES', { weekday: 'short' });
    };

    return (
        <>
            {/* MODAL PASO 2: HABITACIONES */}
            {hook.pasoActual === 2 && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[150px]" onClick={() => hook.retrocederPaso()}>
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <Paso2Habitaciones {...hook} />
                    </div>
                </div>
            )}

            {/* MODAL PASO 3: DATOS DEL CLIENTE */}
            {hook.pasoActual === 3 && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[150px]" onClick={() => hook.retrocederPaso()}>
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <Paso3Datos {...hook} />
                    </div>
                </div>
            )}

            {/* MODAL PASO 4: CONFIRMACIÓN */}
            {hook.pasoActual === 4 && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[150px]" onClick={() => hook.retrocederPaso()}>
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <Paso4Confirmacion
                            {...hook}
                            usuarioActual={hook.usuarioActual}
                            getValues={hook.getValues}
                            idClienteSeleccionado={hook.idClienteSeleccionado}
                            tipoClienteSeleccionado={hook.tipoClienteSeleccionado}
                            habitacionesDisponibles={hook.habitacionesDisponibles}
                            calcularPrecioDinamico={calcularPrecioDinamico}
                            obtenerPrecioBase={obtenerPrecioBase}
                        />
                    </div>
                </div>
            )}

            {/* RESTO DEL CONTENIDO */}

            {/* BARRA STICKY COMPACTA */}
            {!esPanelControl && (
            <div className="sticky top-16 z-40 bg-gradient-to-r from-gris via-white to-gris border-b border-gray-200 shadow-md">
                <div className="px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                        {/* ICONO + INPUTS DE FECHA */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-1 text-[#7a0202]">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            {/* Input Entrada */}
                            <div className="flex items-center gap-2 relative">
                                <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                                    Entrada
                                </label>
                                <button
                                    onClick={() => setCalendarioAbierto(calendarioAbierto === 'entrada' ? null : 'entrada')}
                                    className="px-4 py-2 min-w-32 rounded-lg text-left text-sm font-medium transition-all duration-200 bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner"
                                >
                                    {hook.rango?.from ? formatearFechaCorta(hook.rango.from) : '—'}
                                </button>

                                {/* Calendario Range */}
                                {calendarioAbierto === 'entrada' && (
                                    <>
                                        <style>{`.rdp { --rdp-cell_size: 2.5rem; --rdp-accent_color: #7a0202; --rdp-background_color: #fef2f2; } .rdp-caption { font-weight: 600; color: #1f2937; padding-bottom: 1rem; } .rdp-head_cell { font-weight: 600; color: #6b7280; font-size: 0.875rem; } .rdp-cell { position: relative; } .rdp-day_selected { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day_range_middle { background-color: #fee2e2 !important; color: #1f2937; } .rdp-day_range_start, .rdp-day_range_end { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day:hover:not([disabled]) { background-color: #fee2e2; border-radius: 0.5rem; } .rdp-day_today { font-weight: 700; color: #7a0202; }`}</style>
                                        <div ref={calendarioRef} className="fixed bg-white rounded-xl shadow-2xl p-0 w-[40rem] z-50 left-1/2 -translate-x-1/2" style={{top: '170px', border: '1px solid #f3f4f6'}} data-calendario>
                                            <div className="w-full p-6 bg-gradient-to-br from-white to-gray-50">
                                                <DayPicker mode="range" selected={hook.rango} onSelect={handleSeleccionRango}
                                                    locale={es} disabled={{ before: new Date() }} numberOfMonths={1}
                                                    formatters={{ formatWeekdayName: (date) => formatearNombreDia(date)}} />
                                            </div>
                                            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                                                <button onClick={hook.limpiarRango} className="btn btn-sm btn-outline">
                                                    Limpiar
                                                </button>
                                                <PrimaryButton onClick={() => {
                                                        setCalendarioAbierto(null);
                                                        if (hook.pasoActual === 1) hook.avanzarPaso();
                                                    }}
                                                    disabled={!hook.rango?.from || !hook.rango?.to} className="py-1 px-3 text-xs">
                                                    Continuar
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Input Salida */}
                            <div className="flex items-center gap-2 relative">
                                <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                                    Salida
                                </label>
                                <button
                                    onClick={() => setCalendarioAbierto(calendarioAbierto === 'salida' ? null : 'salida')}
                                    className="px-4 py-2 min-w-32 rounded-lg text-left text-sm font-medium transition-all duration-200 bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!hook.rango?.from}>
                                    {hook.rango?.to ? formatearFechaCorta(hook.rango.to) : '—'}
                                </button>

                                {/* Calendario Range Salida */}
                                {calendarioAbierto === 'salida' && hook.rango?.from && (
                                    <>
                                        <style>{`.rdp { --rdp-cell_size: 2.5rem; --rdp-accent_color: #7a0202; --rdp-background_color: #fef2f2; } .rdp-caption { font-weight: 600; color: #1f2937; padding-bottom: 1rem; } .rdp-head_cell { font-weight: 600; color: #6b7280; font-size: 0.875rem; } .rdp-cell { position: relative; } .rdp-day_selected { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day_range_middle { background-color: #fee2e2 !important; color: #1f2937; } .rdp-day_range_start, .rdp-day_range_end { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day:hover:not([disabled]) { background-color: #fee2e2; border-radius: 0.5rem; } .rdp-day_today { font-weight: 700; color: #7a0202; }`}</style>
                                        <div ref={calendarioRef} className="fixed bg-white rounded-xl shadow-2xl p-0 w-[40rem] z-50 left-1/2 -translate-x-1/2" style={{top: '170px', border: '1px solid #f3f4f6'}} data-calendario>
                                            <div className="w-full p-6 bg-gradient-to-br from-white to-gray-50">
                                                <DayPicker mode="range" selected={hook.rango} onSelect={handleSeleccionRango}
                                                    locale={es} disabled={{ before: new Date() }} numberOfMonths={1}
                                                    formatters={{ formatWeekdayName: (date) => formatearNombreDia(date)}} />
                                            </div>
                                            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                                                <button
                                                    onClick={hook.limpiarRango}
                                                    className="btn btn-sm btn-outline">
                                                    Limpiar
                                                </button>
                                                <PrimaryButton onClick={() => {
                                                    setCalendarioAbierto(null);

                                                   if (hook.pasoActual === 1) hook.avanzarPaso();}}
                                                    disabled={!hook.rango?.from || !hook.rango?.to} className="py-1 px-3 text-xs">

                                                    Continuar
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {noches > 0 && (
                                <div className="flex flex-row items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    <span className="text-xs font-semibold text-gray-600">Noches:</span>
                                    <span className="text-sm font-bold text-[#7a0202] bg-red-50 px-2 py-0.5 rounded">{noches}</span>
                                </div>
                            )}
                        </div>

                        {/* ESPACIADOR */}
                        <div className="flex-grow"></div>

                        {/* TYPING ANIMATION - CTA/PUBLICIDAD */}
                        <div className="hidden sm:block px-4 py-1">
                            <div className="text-xs">
                                <TypingAnimation words={[
                                        'Descuento 15% en próximas reservas',
                                        'Cancelación gratis hasta 48h',
                                        'Garantía de mejor precio',
                                        '+5000 clientes satisfechos']}
                                    typeSpeed={60} deleteSpeed={40} pauseDelay={2500} loop={true}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </>
    );
}
