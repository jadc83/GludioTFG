import { useState, useEffect } from 'react';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import TarifasSelector from '@/Components/reservas/TarifasSelector';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import { UsersIcon, InformationCircleIcon, PlusIcon, MinusIcon, WifiIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';

export default function Paso2Habitaciones({
    estaCargandoHabitaciones, habitacionesSeleccionadas, agruparHabitacionesPorTipo, getImagen,
    actualizarSeleccionHabitacion, getTotalHabitaciones, avanzarPaso, retrocederPaso,
    numHuespedes, rango, preciosPorTipo = {}
}) {
    const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
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

    return (
        /* CAMBIO CLAVE: h-auto en lugar de h-full para que el modal se encoja si hay poco contenido */
        <div className="relative z-10 mx-auto flex h-auto max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">

            {/* HEADER COMPACTO */}
            <header className="flex-none border-b border-gray-100 bg-white px-8 py-5 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-xl font-black leading-none text-gray-900 uppercase tracking-tighter">
                            SELECCIÓN DE <span className="text-[#7a0202]">ACTIVOS</span>
                        </h1>
                        <p className="mt-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Step 02 / Disponibilidad</p>
                    </div>
                    <ReservaBreadcrumbs activeIndex={1} separator="chevron" textClass="text-[9px]" />
                </div>
            </header>

            {/* MAIN: Ajustado para no forzar altura mínima innecesaria */}
            <main className="flex-none md:flex-1 overflow-hidden flex flex-col md:flex-row bg-gris">

                {/* LISTADO DE TARJETAS */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6 pb-4 mt-8"> {/* Padding bottom reducido; espacio superior aumentado y mayor separación entre tarjetas */}
                        {estaCargandoHabitaciones ? (
                            <div className="py-12 text-center"><span className="loading loading-spinner text-[#7a0202]"></span></div>
                        ) : (
                            entradasVisibles.map(([tipo, info]) => {
                                const isSelected = habitacionesSeleccionadas[tipo]?.cantidad > 0;
                                return (
                                    <article key={tipo} className={`group flex flex-col md:flex-row bg-white rounded-xl border transition-all duration-300 ${ isSelected ? 'border-[#7a0202] ring-1 ring-[#7a0202] shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                                        <div className="relative w-full md:w-48 h-28 md:h-32 bg-gray-900 shrink-0">
                                            <img src={getImagen(tipo)} className="h-full w-full object-cover opacity-90" alt={tipo} />
                                            <button onClick={() => setImagenModalAbierto(tipo)} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <InformationCircleIcon className="h-6 w-6 text-white" />
                                            </button>
                                        </div>

                                        <div className="flex-1 p-4 flex flex-col justify-center">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{tipo}</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                            <UsersIcon className="h-3 w-3" /> {info.capacidadMaxima} PAX
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                            <WifiIcon className="h-3 w-3" /> FIBER
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-[#7a0202]">{(preciosPorTipo[tipo] ?? info.precioEntreNoche ?? info.precioTipo ?? info.precioMinimo)}€</p>
                                                        <p className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">Precio medio por noche</p>
                                                    </div>

                                                    <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                                                        {isSelected ? (
                                                            <div className="flex items-center gap-3">
                                                                <button onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', 0)} className="p-2 text-gray-400 hover:text-red-700 transition-colors">
                                                                    <MinusIcon className="h-4 w-4 stroke-[3]" />
                                                                </button>
                                                                <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded border border-green-100 uppercase">Listo</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                disabled={!puedoSeleccionarMas}
                                                                onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', 1)}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-[#7a0202] disabled:opacity-20 active:scale-95 transition-all"
                                                            >
                                                                <PlusIcon className="h-3 w-3 stroke-[3]" /> Seleccionar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ASIDE: Selector de Tarifas (w-96 para que sea grande) */}
                <aside className="w-full md:w-96 flex-none bg-gris border-t md:border-t-0 md:border-l border-gray-200 flex flex-col">
                    <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="border-l-4 border-[#7a0202] pl-4">
                            <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.25em]">Configuración</h5>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Servicios Adicionales</p>
                        </div>

                        <div className="bg-white/60 rounded-xl p-5 border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md">
                            <TarifasSelector tarifas={tarifas} seleccion={seleccionTarifas} onChange={setSeleccionTarifas} />
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 bg-gris">
                        <DetalleSubtotal habitacionesSeleccionadas={habitacionesSeleccionadas} rango={rango} tipos={tipos} preciosPorTipo={preciosPorTipo} tarifasSeleccionadas={seleccionTarifas} tarifas={tarifas} />
                    </div>
                </aside>
            </main>

            {/* FOOTER: Reducido en padding vertical */}
            <footer className="flex-none border-t border-gray-100 bg-white px-10 py-5">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button onClick={retrocederPaso} className="flex items-center gap-2 text-[10px] font-black text-gray-400 transition-colors uppercase tracking-[0.2em] hover:text-gray-900">
                        <ArrowLeftIcon className="h-3 w-3" /> Volver
                    </button>
                    <button onClick={avanzarPaso} disabled={totalSeleccionado === 0} className="px-12 py-4 bg-[#7a0202] text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-lg shadow-xl shadow-red-900/20 hover:bg-black transition-all active:scale-95 disabled:opacity-20">
                        Siguiente Paso →
                    </button>
                </div>
            </footer>
        </div>
    );
}
