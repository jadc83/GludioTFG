import { useState, useEffect } from 'react';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import TarifasSelector from '@/Components/reservas/TarifasSelector';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import {
    UsersIcon,
    HomeIcon,
    ChevronRightIcon,
    XMarkIcon,
    InformationCircleIcon,
    SparklesIcon,
    ShieldCheckIcon,
    WifiIcon,
    PlusIcon,
    MinusIcon
} from '@heroicons/react/24/outline';

export default function Paso2Habitaciones({
    estaCargandoHabitaciones, habitacionesSeleccionadas, agruparHabitacionesPorTipo, getImagen,
    actualizarSeleccionHabitacion, getTotalHabitaciones, getTotalDisponibles, avanzarPaso, retrocederPaso,
    numHuespedes, rango
}) {
    const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
    const [tabModal, setTabModal] = useState('specs'); // Estilo tabs para el modal
    const [tarifas, setTarifas] = useState([]);
    const [seleccionTarifas, setSeleccionTarifas] = useState({});

    const tipos = agruparHabitacionesPorTipo(numHuespedes);
    const totalSeleccionado = getTotalHabitaciones();
    const entradasVisibles = Object.entries(tipos).filter(([, info]) => (info.cantidad || 0) > 0);
    const totalDisponibles = Object.values(tipos).reduce((sum, info) => sum + (info.cantidad || 0), 0);
    const puedoSeleccionarMas = totalSeleccionado < totalDisponibles && totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;

    useEffect(() => {
        let mounted = true;
        fetch('/api/tarifas').then(r => r.ok ? r.json() : []).then(data => { if (mounted) setTarifas(data || []); });
        return () => { mounted = false; };
    }, []);

    const Migitas = () => (
        <nav aria-label="Progreso" className="flex items-center gap-1 md:gap-3 overflow-x-auto no-scrollbar py-1 md:py-2 mt-2 md:mt-0">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <div key={i} className="flex items-center gap-1 shrink-0">
                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] ${
                        i === 1 ? 'text-[#7a0202]' : i < 1 ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                        {etiqueta}
                    </span>
                    {i < 3 && <span className="text-gray-200">/</span>}
                </div>
            ))}
        </nav>
    );

    return (
        <div className="flex h-full md:h-[calc(100vh-155px)] flex-col bg-white overflow-hidden overflow-x-hidden rounded-[2.5rem] shadow-2xl border-x border-t  -mt-8 md:-mt-12 relative z-10">
            <header className="flex-none py-16 px-4 md:px-10 border-b  bg-gris">
                <div className="max-w-7xl mx-auto bg-gris flex flex-col md:flex-row justify-between items-center md:items-center">
                    <h1 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                        Reserva de <span className="text-[#7a0202]">Activos</span>
                    </h1>
                    <Migitas />
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gris">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    <div className="max-w-5xl mx-auto flex flex-col gap-4 md:gap-6">
                        {estaCargandoHabitaciones ? (
                                <div className="py-20 text-center"><span className="loading loading-spinner text-[#7a0202]"></span></div>
                            ) : (
                                entradasVisibles.length > 0 ? (
                                    entradasVisibles.map(([tipo, info]) => {
                                        const isSelected = habitacionesSeleccionadas[tipo]?.cantidad > 0;
                                        return (
                                            <article key={tipo} className={`flex flex-col md:flex-row bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isSelected ? 'border-[#7a0202] shadow-xl' : ' hover:shadow-md'}`}>
                                                <div className="relative w-full md:w-52 h-32 md:h-32 bg-gray-900">
                                                    <img src={getImagen(tipo)} className="h-full w-full object-cover opacity-90" alt={tipo} />
                                                    <button onClick={() => setImagenModalAbierto(tipo)} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <InformationCircleIcon className="h-7 w-7 text-white" />
                                                    </button>
                                                </div>
                                                <div className="flex-1 p-4 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-base font-black text-gray-900 uppercase leading-none">{tipo}</h4>
                                                            <p className="text-[9px] text-[#7a0202] font-black uppercase mt-2 tracking-widest">{info.precioMinimo}€/noche</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex justify-between items-center">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <UsersIcon className="h-3 w-3" /> {info.capacidadMaxima}
                                                        </span>

                                                        {/* BOTONES MINIMALISTAS: + y - */}
                                                        <div className="flex items-center gap-2">
                                                            {isSelected && (
                                                                <button
                                                                    onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', 0)}
                                                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-900 hover:bg-red-700 hover:text-white rounded-lg transition-colors shadow-sm"
                                                                    title="Quitar"
                                                                >
                                                                    <MinusIcon className="h-4 w-4 stroke-[3]" />
                                                                </button>
                                                            )}
                                                            <button
                                                                disabled={!puedoSeleccionarMas || isSelected}
                                                                onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', 1)}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm active:scale-95 ${
                                                                    isSelected
                                                                    ? 'bg-green-100 text-green-700 cursor-default'
                                                                    : 'bg-[#7a0202] text-white hover:bg-black disabled:opacity-30'
                                                                }`}
                                                                title="Añadir"
                                                            >
                                                                <PlusIcon className="h-4 w-4 stroke-[3]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 text-center text-gray-500">
                                        <p>No hay habitaciones disponibles para las fechas seleccionadas.</p>
                                        <div className="mt-3">
                                            <button onClick={() => { try { if (typeof window !== 'undefined' && window?.formularioReservaRef?.recargarDisponibles) { window.formularioReservaRef.recargarDisponibles(); } } catch (e) {} }} className="px-4 py-2 bg-[#7a0202] text-white rounded">Reintentar</button>
                                        </div>
                                    </div>
                                )
                            )}
                    </div>
                </div>

                <aside className="w-full md:w-72 flex-none bg-gris border-t md:border-t-0 md:border-l  flex flex-col max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-hidden">

                    <div className="flex-1 p-4 md:p-5">
                        <TarifasSelector tarifas={tarifas} seleccion={seleccionTarifas} onChange={setSeleccionTarifas} />
                    </div>
                    <div className="p-4 md:p-6  border-t ">
                        <DetalleSubtotal habitacionesSeleccionadas={habitacionesSeleccionadas} rango={rango} tipos={tipos} tarifasSeleccionadas={seleccionTarifas} tarifas={tarifas} />
                    </div>
                </aside>
            </main>

            <footer className="flex-none p-4 md:p-4 border-t bg-gris">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-2">
                    <button onClick={retrocederPaso} className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">← Volver</button>
                    <button
                        onClick={avanzarPaso}
                        disabled={totalSeleccionado === 0}
                        className="px-8 py-3.5 bg-[#7a0202] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-lg shadow-xl hover:bg-black transition-all disabled:opacity-50"
                    >
                        Siguiente →
                    </button>
                </div>
            </footer>

            {/* MODAL CON PESTAÑAS (Estilo Solicitado) */}
            {imagenModalAbierto && (
                <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setImagenModalAbierto(null)} />
                    <div className="relative w-full max-w-2xl bg-gris rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] md:max-h-[74vh] animate-in slide-in-from-bottom duration-500">

                        <div className="relative h-44 md:h-60 shrink-0">
                            <img src={getImagen(imagenModalAbierto)} className="h-full w-full object-cover" alt={imagenModalAbierto} />
                            <button onClick={() => setImagenModalAbierto(null)} className="absolute right-5 top-5 p-2 bg-white/90 text-gray-900 hover:text-red-700 rounded-full shadow-lg"><XMarkIcon className="h-5 w-5" /></button>
                        </div>

                        {/* Pestañas del Modal */}
                        <nav className="flex border-b  shrink-0 bg-white sticky top-0 z-10">
                            <button onClick={() => setTabModal('specs')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${tabModal === 'specs' ? 'border-[#7a0202] text-[#7a0202] bg-red-50/30' : 'border-transparent text-gray-400'}`}>Especificaciones</button>
                            <button onClick={() => setTabModal('servicios')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${tabModal === 'servicios' ? 'border-[#7a0202] text-[#7a0202] bg-red-50/30' : 'border-transparent text-gray-400'}`}>Servicios</button>
                        </nav>

                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {tabModal === 'specs' ? (
                                <div className="space-y-5 animate-in fade-in duration-300">
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{imagenModalAbierto}</h2>
                                    <p className="text-[11px] text-gray-500 uppercase tracking-tighter leading-relaxed border-l-4  pl-5 text-justify">
                                        {tipos[imagenModalAbierto]?.descripcion || 'Unidad de rendimiento optimizada diseñada para la máxima productividad.'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-2xl border  flex items-center gap-3">
                                            <UsersIcon className="h-4 w-4 text-[#7a0202]" />
                                            <span className="text-[10px] font-black uppercase">{tipos[imagenModalAbierto]?.capacidadMaxima} PAX</span>
                                        </div>
                                        <div className="p-3  rounded-2xl border  flex items-center gap-3">
                                            <WifiIcon className="h-4 w-4 text-[#7a0202]" />
                                            <span className="text-[10px] font-black uppercase">1GB Fiber</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 animate-in fade-in duration-300">
                                    {['Climatización inteligente', 'Insonorización 45dB', 'Acceso biométrico QR', 'Servicio Concierge 24/7'].map((s, i) => (
                                        <div key={i} className="p-3 border border-gray-50 rounded-2xl flex items-center gap-4 text-[10px] font-bold uppercase text-gray-600">
                                            <SparklesIcon className="h-4 w-4 text-[#7a0202]" /> {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t  flex items-center justify-between gap-6 /50">
                            <p className="text-xl font-black text-[#7a0202]">{tipos[imagenModalAbierto]?.precioMinimo}€</p>
                            {/* Selector interno modal igualmente compacto */}
                            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border ">
                                <button onClick={() => actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', Math.max(0, (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-900 hover:bg-red-700 hover:text-white transition-all font-black">−</button>
                                <span className="w-4 text-center font-black text-sm">{habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0}</span>
                                <button onClick={() => { const actual = (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0); actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', actual + 1); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-[#7a0202] transition-all font-black">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
