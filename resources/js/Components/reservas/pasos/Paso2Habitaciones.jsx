import { useState, useEffect } from 'react';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import TarifasSelector from '@/Components/reservas/TarifasSelector';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import { UsersIcon, InformationCircleIcon, PlusIcon, MinusIcon, WifiIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import CarruselFrases from '@/Components/reservas/CarruselFrases';

export default function Paso2Habitaciones({
    estaCargandoHabitaciones, habitacionesSeleccionadas, agruparHabitacionesPorTipo, getImagen,
    actualizarSeleccionHabitacion, getTotalHabitaciones, avanzarPaso, retrocederPaso,
    numHuespedes, rango, preciosPorTipo = {}, actualizarTarifas = () => {}, selectedTarifas = {}
}) {
    const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
    const [tarifas, setTarifas] = useState([]);
    const [tiposHabitacion, setTiposHabitacion] = useState({});

    useEffect(() => {
        console.log('Paso2 - selectedTarifas prop recibido:', selectedTarifas);
    }, [selectedTarifas]);

    // Cargar tipos de habitación para obtener capacidades
    useEffect(() => {
        const cargarTipos = async () => {
            try {
                const res = await fetch('/api/tipos-habitaciones/list');
                if (res.ok) {
                    const response = await res.json();
                    const data = response.data || [];
                    const mapa = {};
                    data.forEach(tipo => {
                        mapa[tipo.nombre?.toLowerCase() || tipo.slug] = tipo.capacidad;
                    });
                    setTiposHabitacion(mapa);
                }
            } catch (e) {
                console.error('Error cargando tipos:', e);
            }
        };
        cargarTipos();
    }, []);

    const tipos = agruparHabitacionesPorTipo(numHuespedes);
    const totalSeleccionado = getTotalHabitaciones();
    const entradasVisibles = Object.entries(tipos).filter(([, info]) => (info.cantidad || 0) > 0);
    const totalDisponibles = Object.values(tipos).reduce((sum, info) => sum + (info.cantidad || 0), 0);
    const puedoSeleccionarMas = totalSeleccionado < totalDisponibles && totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;

    // Obtener imágenes del tipo de habitación - primero intenta fotos, luego getImagen
    const getImagenes = (tipo) => {
        const info = tipos[tipo];
        if (info?.fotos && Array.isArray(info.fotos) && info.fotos.length > 0) {
            return info.fotos;
        }

        // URLs de prueba para diferentes tipos de habitaciones
        const imagenesDePrueba = {
            'suite presidencial': [
                'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop',
            ],
            'habitación deluxe': [
                'https://images.unsplash.com/photo-1578463019375-e95ebb7b6ee5?w=1200&h=800&fit=crop',
                'https://images.unsplash.com/photo-1590080876-12d6b4a1b0e0?w=1200&h=800&fit=crop',
                'https://images.unsplash.com/photo-1618770260098-1eb3be6c06ba?w=1200&h=800&fit=crop',
            ],
            'habitación estándar': [
                'https://images.unsplash.com/photo-1520631892298-1b434c919eba?w=1200&h=800&fit=crop',
                'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=1200&h=800&fit=crop',
                'https://images.unsplash.com/photo-1505797149185-41d8d18f2d5b?w=1200&h=800&fit=crop',
            ],
        };

        return imagenesDePrueba[tipo?.toLowerCase()] || [getImagen(tipo)];
    };

    useEffect(() => {
        let mounted = true;
        fetch('/api/tarifas').then(r => r.ok ? r.json() : []).then(data => { if (mounted) setTarifas(data || []); });
        return () => { mounted = false; };
    }, []);

    return (
        /* CAMBIO CLAVE: h-auto en lugar de h-full para que el modal se encoja si hay poco contenido */
        <div className="relative z-10 mx-auto flex h-auto max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-gradient-to-br from-[#920303] to-[#6b0202] shadow-2xl">

            {/* HEADER COMPACTO */}
            <header className="flex-none bg-gris px-8 py-5 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-xl font-black leading-none text-gray-900 uppercase tracking-tighter">
                            ¿Dónde quieres <span className="text-[#7a0202]">dormir?</span>
                        </h1>
                        <p className="mt-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Step 02 / Disponibilidad</p>
                    </div>
                    <ReservaBreadcrumbs activeIndex={1} separator="chevron" textClass="text-[9px]" />
                </div>
            </header>

            {/* MAIN: Ajustado para no forzar altura mínima innecesaria */}
            <main className="flex-none md:flex-1 overflow-hidden flex flex-col md:flex-row">

                {/* LISTADO DE TARJETAS */}
                <div className="flex-1 overflow-y-auto px-6 custom-scrollbar flex flex-col justify-evenly bg-black/20">
                    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">{/* Espacio uniforme entre tarjetas */}
                        {estaCargandoHabitaciones ? (
                            <div className="py-12 text-center"><span className="loading loading-spinner text-[#7a0202]"></span></div>
                        ) : (
                            entradasVisibles.map(([tipo, info]) => {
                                const isSelected = habitacionesSeleccionadas[tipo]?.cantidad > 0;
                                return (
                                    <article key={tipo} className={`group flex flex-col md:flex-row bg-gris rounded-xl transition-all duration-300 ${ isSelected ? 'ring-2 ring-[#7a0202] shadow-md' : 'shadow-sm'}`}>
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

                                                    <div className="flex items-center gap-2 pl-6">
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
                <aside className="w-full md:w-96 flex-none bg-black/20 border-t md:border-t-0 md:border-l border-white/10 flex flex-col">
                    <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="border-l-4 border-white/20 pl-4">
                            <h5 className="text-[10px] font-black text-white uppercase tracking-[0.25em]">A su disposición</h5>
                            <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-1">Servicios Adicionales</p>
                        </div>

                        <div className="rounded-xl p-5 shadow-sm">
                            <TarifasSelector tarifas={tarifas} seleccion={selectedTarifas} onChange={actualizarTarifas} />
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10">
                        <DetalleSubtotal habitacionesSeleccionadas={habitacionesSeleccionadas} rango={rango} tipos={tipos} preciosPorTipo={preciosPorTipo} tarifasSeleccionadas={selectedTarifas} tarifas={tarifas} />
                    </div>
                </aside>
            </main>

            {/* FOOTER: Reducido en padding vertical */}
            <footer className="flex-none bg-gris px-10 py-5">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button onClick={() => retrocederPaso()} className="flex items-center gap-2 text-[10px] font-black text-gray-400 transition-colors uppercase tracking-[0.2em] hover:text-gray-900">
                        <ArrowLeftIcon className="h-3 w-3" /> Volver
                    </button>
                    <button onClick={avanzarPaso} disabled={totalSeleccionado === 0} className="px-12 py-4 bg-[#7a0202] text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-lg shadow-xl shadow-red-900/20 hover:bg-black transition-all active:scale-95 disabled:opacity-20">
                        Siguiente Paso →
                    </button>
                </div>
            </footer>

            {/* MODAL: Detalle de habitación */}
            {imagenModalAbierto && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setImagenModalAbierto(null)}>
                    <div className="bg-gradient-to-br from-[#920303] to-[#6b0202] rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden border border-[#c41e3a]/30" onClick={(e) => e.stopPropagation()}>

                        {/* Grid Layout: Carrusel a la izquierda, info a la derecha */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 max-h-[600px] lg:max-h-[700px]">

                            {/* COLUMNA IZQUIERDA: Carrusel (3 columnas) */}
                            <div className="lg:col-span-3 relative bg-black/30 flex flex-col overflow-hidden p-4">
                                <div className="flex-1 overflow-hidden rounded-2xl">
                                    <Splide options={{ type: 'loop', perPage: 1, arrows: true, pagination: true, autoplay: true, interval: 5000, pauseOnHover: true }} className="h-full splide-modal-carrusel">
                                        {getImagenes(imagenModalAbierto).map((imagen, idx) => (
                                            <SplideSlide key={idx}>
                                                <img src={imagen} alt={`${imagenModalAbierto} ${idx + 1}`} className="w-full h-full object-cover" />
                                            </SplideSlide>
                                        ))}
                                    </Splide>
                                </div>

                                {/* CTA Section bajo la foto */}
                                <div className="bg-gradient-to-r from-[#920303] to-[#7a0202] border-t border-white/10 p-4 text-center flex-none m-4 mt-4 rounded-2xl">
                                    <p className="text-xs font-bold text-white/80 mb-2 uppercase tracking-widest">¿Te gusta esta habitación?</p>
                                    <CarruselFrases
                                        noches={rango?.from && rango?.to
                                            ? Math.ceil((rango.to - rango.from) / (1000 * 60 * 60 * 24))
                                            : 0
                                        }
                                    />
                                </div>

                                {/* Botón cerrar */}
                                <button onClick={() => setImagenModalAbierto(null)} className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white rounded-full p-3 transition z-10 shadow-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* COLUMNA DERECHA: Información (2 columnas) */}
                            <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-br from-[#920303]/50 to-[#6b0202]/50 border-l border-white/10">

                                {/* HEADER */}
                                <div>
                                    <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-4">
                                        <p className="text-xs font-black text-white/80 uppercase tracking-widest">Habitación</p>
                                    </div>
                                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                        {imagenModalAbierto}
                                    </h2>
                                </div>

                                {/* STATS EN 2 COLUMNAS */}
                                <div className="space-y-4 mb-8">
                                    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition">
                                        <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Capacidad</p>
                                        <div className="flex items-baseline gap-3">
                                            <UsersIcon className="w-6 h-6 text-white/80" />
                                            <p className="text-3xl font-black text-white">{tipos[imagenModalAbierto]?.capacidadMaxima || tiposHabitacion[imagenModalAbierto?.toLowerCase()] || 0}</p>
                                            <p className="text-sm text-white/60 font-bold">PERSONAS</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition">
                                        <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Precio por noche</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-4xl font-black text-white">{preciosPorTipo[imagenModalAbierto] || tipos[imagenModalAbierto]?.precioTipo || 0}</p>
                                            <p className="text-lg text-white/70 font-bold">€</p>
                                        </div>
                                    </div>
                                </div>

                                {/* SERVICIOS */}
                                <div className="mb-8">
                                    <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Servicios incluidos</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-white/80 font-semibold">
                                            <div className="w-2 h-2 rounded-full bg-white/80" />
                                            <WifiIcon className="w-5 h-5 text-white" />
                                            Fibra Óptica 1Gbps
                                        </div>
                                        <div className="flex items-center gap-3 text-white/80 font-semibold">
                                            <div className="w-2 h-2 rounded-full bg-white/80" />
                                            <span>🛏️</span> Comodidad Premium
                                        </div>
                                        <div className="flex items-center gap-3 text-white/80 font-semibold">
                                            <div className="w-2 h-2 rounded-full bg-white/80" />
                                            <span>🛁</span> Baño Lujoso
                                        </div>
                                    </div>
                                </div>

                                {/* BOTÓN */}
                                <button onClick={() => setImagenModalAbierto(null)} className="w-full px-6 py-4 bg-white text-[#920303] font-black uppercase tracking-wider rounded-xl hover:bg-gray-100 transition shadow-lg active:scale-95">
                                    Continuar seleccionando
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
