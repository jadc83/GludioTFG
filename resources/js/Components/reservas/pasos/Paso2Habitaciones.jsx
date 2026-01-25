import { useState, useEffect } from 'react';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import Campo from '@/Components/formulario/Campo';
import TarifasSelector from '@/Components/reservas/TarifasSelector';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import { useLayoutEffect } from 'react';

export default function Paso2Habitaciones({
    estaCargandoHabitaciones, habitacionesSeleccionadas, agruparHabitacionesPorTipo, getImagen,
    actualizarSeleccionHabitacion, getTotalHabitaciones, getTotalDisponibles, avanzarPaso, retrocederPaso,
    numHuespedes, rango
}) {
    const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
    const tipos = agruparHabitacionesPorTipo(numHuespedes);
    const totalDisponibles = Object.values(tipos).reduce((sum, info) => sum + (info.cantidad || 0), 0);
    const entradasVisibles = Object.entries(tipos).filter(([, info]) => (info.cantidad || 0) > 0);
    const totalSeleccionado = getTotalHabitaciones();
    const puedoSeleccionarMas = totalSeleccionado < totalDisponibles && totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;
    const [seleccionTarifas, setSeleccionTarifas] = useState({});
    const [tarifas, setTarifas] = useState([]);

    function toggleTarifa(id) {
        setSeleccionTarifas(prev => ({ ...prev, [id]: !prev[id] }));
    }

    useEffect(() => {
        let mounted = true;
        fetch('/api/tarifas')
            .then(r => r.ok ? r.json() : [])
            .then(data => { if (mounted) setTarifas(data || []); })
            .catch(() => { if (mounted) setTarifas([]); });
        return () => { mounted = false; };
    }, []);

    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto flex max-w-xs justify-center items-center gap-2 text-xs">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <div key={i} className="flex items-center gap-2">
                    {i === 1 && <span className="text-[#7a0202] font-bold">›</span>}
                    <span className={`${i === 1 ? 'font-bold text-[#7a0202]' : 'text-gray-600'}`}>{etiqueta}</span>
                    {i < 3 && <span className="text-gray-300 text-xs">›</span>}
                </div>
            ))}
        </nav>
    );

    const [gridTemplate, setGridTemplate] = useState('1fr');

    useLayoutEffect(() => {
        const calcular = () => {
            const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
            // Basado en breakpoints: <768 -> 1, >=768 -> 2, >=1280 ->3
            const desiredCols = w >= 1280 ? 3 : (w >= 768 ? 2 : 1);
            const cardsCols = Math.min(desiredCols, Math.max(1, entradasVisibles.length));
            if (w >= 768) {
                setGridTemplate(`repeat(${cardsCols}, minmax(220px, 1fr)) 320px`);
            } else {
                setGridTemplate('1fr');
            }
        };

        calcular();
        window.addEventListener('resize', calcular);
        return () => window.removeEventListener('resize', calcular);
    }, [entradasVisibles.length]);

    return (
        <div className="flex h-full flex-col bg-gris rounded-lg">
            <header className="bg-gris px-3 md:px-4 pb-2 pt-3">
                <h3 className="titulo-rojo titulo-espaciado mb-1 text-center text-sm md:text-lg font-bold">Selecciona tus habitaciones</h3>
                <Migitas />
            </header>

<main className="flex-1 overflow-y-auto bg-gris px-4 py-4">
    {estaCargandoHabitaciones ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 py-12">
            <span className="spinner-rojo loading loading-spinner loading-lg text-[#7a0202]"></span>
            <p className="text-sm font-medium text-gray-600">Buscando disponibilidad...</p>
        </div>
    ) : Object.keys(tipos).length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <p className="text-lg text-gray-600">No hay habitaciones disponibles</p>
            <p className="mt-2 text-sm text-gray-400">Intenta con otras fechas</p>
        </div>
    ) : (
        <div className="w-full mx-auto">
            {/* Indicador de límite eliminado por solicitud del usuario */}

            {/* Layout Principal: columna flexible para habitaciones + sidebar fijo para tarifas */}
            <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: gridTemplate }}>

                {/* Tarjetas de Habitaciones (fluirán en la rejilla) */}
                {entradasVisibles.map(([tipo, info]) => {
                        const isSelected = habitacionesSeleccionadas[tipo]?.cantidad > 0;
                        const puedeAgregarMas = puedoSeleccionarMas || isSelected;

                        return (
                            <article
                                key={tipo}
                                className={`flex flex-col overflow-hidden rounded-xl transition-all duration-300 bg-white border ${
                                    isSelected
                                    ? 'ring-2 ring-[#7a0202] border-transparent shadow-md'
                                    : 'border-gray-200 hover:shadow-lg'
                                } ${!puedeAgregarMas && !isSelected ? 'opacity-50 grayscale-[0.5]' : ''}`}
                            >
                                {/* Imagen más contenida */}
                                <div
                                    className="relative h-36 w-full overflow-hidden cursor-pointer group"
                                    onClick={() => setImagenModalAbierto(tipo)}
                                >
                                    {getImagen(tipo) ? (
                                        <img src={getImagen(tipo)} alt={tipo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">Ver detalles</span>
                                    </div>
                                </div>

                                {/* Contenido de la tarjeta */}
                                <div className="flex flex-col flex-1 p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-bold text-gray-900 leading-tight">{tipo}</h4>
                                        <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                                            <span>{info.capacidadMaxima}</span>
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                                        </div>
                                    </div>

                                    {/* Descripción corta (varias líneas, clamp). Usar fallback si no existe texto en datos */}
                                    {(() => {
                                        const desc = info.descripcion || info.descripcion_corta || info.descripcionCorta || `Disfruta de la habitación ${tipo.toLowerCase()}, perfecta para ${info.capacidadMaxima} persona${info.capacidadMaxima > 1 ? 's' : ''}. Cama cómoda, baño privado y amenities esenciales para una estancia agradable.`;
                                        return (
                                            <p style={{ wordSpacing: '0.08em', WebkitHyphens: 'auto', hyphens: 'auto' }} className="text-sm text-gray-700 mt-1 line-clamp-4 text-justify">{desc}</p>
                                        );
                                    })()}

                                    <div className="mt-auto pt-4 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Desde</p>
                                            <p className="text-lg font-black text-[#7a0202]">{info.precioMinimo}€<span className="text-xs font-normal text-gray-500">/noche</span></p>
                                        </div>

                                        <div className="w-1/2">
                                            {isSelected ? (
                                                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-1">
                                                     <button
                                                        onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', 0)}
                                                        className="text-gray-400 hover:text-red-600 p-1"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                    <span className="font-bold text-[#7a0202]">Elegida</span>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={!puedeAgregarMas}
                                                    onClick={() => {
                                                        actualizarSeleccionHabitacion(tipo, 'cantidad', 1);
                                                    }}
                                                    className={`w-full py-1.5 px-3 text-xs font-bold rounded-md transition-all ${
                                                        puedeAgregarMas
                                                        ? 'bg-black text-white hover:bg-[#7a0202] active:scale-95'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {puedeAgregarMas ? 'Seleccionar' : 'Límite'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                {/* Selector/Sidebar como última columna */}
                <div className="order-last lg:order-none">
                    <div>
                        <TarifasSelector tarifas={tarifas} seleccion={seleccionTarifas} onChange={setSeleccionTarifas} />
                    </div>

                    <div className="mt-3 px-2">
                        <DetalleSubtotal
                            habitacionesSeleccionadas={habitacionesSeleccionadas}
                            rango={rango}
                            tipos={tipos}
                            tarifasSeleccionadas={seleccionTarifas}
                            tarifas={tarifas}
                        />
                    </div>
                </div>
            </div>
        </div>
    )}
</main>

            <footer className="border-t border-gray-300 bg-gris px-2 md:px-4 py-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3">
                    <PrimaryButton onClick={() => {
                        retrocederPaso();
                        //delay para que se actualice el paso antes de abrir el calendario
                        setTimeout(() => { window.dispatchEvent(new CustomEvent('abrirCalendario', { detail: 'entrada' }));
                        }, 100);
                    }} className="px-6">← Volver a fechas</PrimaryButton>
                    <PrimaryButton onClick={avanzarPaso} disabled={getTotalHabitaciones() === 0} className="px-8">Continuar →</PrimaryButton>
                </div>
            </footer>

            {/* Modal de imagen grande */}
            {imagenModalAbierto && (
                <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/75 overflow-y-auto pt-[20px] md:pt-[60px] p-2 md:p-0" onClick={() => setImagenModalAbierto(null)}>
                    <div className="relative w-full max-w-7xl rounded-lg bg-gris mb-12" onClick={(e) => e.stopPropagation()}>
                        {/* Botón cerrar */}
                        <button onClick={() => setImagenModalAbierto(null)}
                            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#7a0202] text-xl font-bold text-white shadow-md hover:bg-[#8b0303]">
                            ✕
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8">
                            {/* Galería y descripción */}
                            <div className="col-span-1 md:col-span-2">
                                {/* Foto principal */}
                                <div className="mb-4 md:mb-6 rounded-lg overflow-hidden bg-gris aspect-video">
                                    <img src={getImagen(imagenModalAbierto)} alt={imagenModalAbierto}
                                        className="w-full h-full object-cover"/>
                                </div>

                                {/* Descripción */}
                                <div className="mb-6 md:mb-8">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Habitación {imagenModalAbierto}</h2>
                                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                                        Disfruta del máximo confort en nuestras habitaciones {imagenModalAbierto.toLowerCase()},
                                        diseñadas para proporcionar una experiencia inolvidable. Cada detalle ha sido cuidadosamente
                                        seleccionado para garantizar tu comodidad y satisfacción.
                                    </p>
                                </div>

                                {/* Servicios */}
                                <div>
                                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Amenidades incluidas</h3>
                                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                                        {[
                                            { icon: '🛏️', name: 'Cama premium' },
                                            { icon: '❄️', name: 'Aire acondicionado' },
                                            { icon: '📺', name: 'Smart TV' },
                                            { icon: '🚿', name: 'Baño privado' },
                                            { icon: '📶', name: 'WiFi de alta velocidad' },
                                            { icon: '☕', name: 'Cafetera' },
                                        ].map((servicio, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                                                <span className="text-xl">{servicio.icon}</span>
                                                <span className="text-sm text-gray-700">{servicio.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Panel lateral */}
                            <div className="col-span-1 md:col-span-1">
                                <div className="rounded-lg border border-gray-200 p-3 md:p-5 shadow-sm md:sticky md:top-28 bg-gris">
                                    {/* Título */}
                                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-5">{imagenModalAbierto}</h3>

                                    {/* Capacidad */}
                                    <div className="mb-5 pb-5 border-b border-gray-200">
                                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Capacidad máxima</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {tipos[imagenModalAbierto]?.capacidadMaxima}
                                            <span className="text-sm font-normal text-gray-600 ml-1">personas</span>
                                        </p>
                                    </div>

                                    {/* Disponibles: eliminado por diseño */}

                                    {/* Precio */}
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Desde</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-[#7a0202]">{tipos[imagenModalAbierto]?.precioMinimo || '—'}</span>
                                            <span className="text-sm text-gray-600">€/noche</span>
                                        </div>
                                    </div>

                                    {/* Cantidad */}
                                    <div className="mb-4">
                                        <label className="text-xs font-semibold uppercase text-gray-600 block mb-3">Seleccionar cantidad</label>
                                        <div className="flex gap-2 items-stretch">
                                            <button type="button" onClick={() => actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', Math.max(0, (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) - 1))}
                                                disabled={(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) === 0}
                                                className="w-10 h-10 flex-shrink-0 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center">
                                                −
                                            </button>
                                            <Campo
                                                id={`cantidad_${imagenModalAbierto}`}
                                                type="number"
                                                readOnly
                                                clase="flex-1 min-w-0 px-2 text-center border border-gray-300 rounded font-bold text-lg bg-gris"
                                                value={habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0}
                                            />
                                            <button type="button" onClick={() => {
                                                const totalSel = totalSeleccionado;
                                                const maxPorReserva = CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;
                                                const disponiblesTipo = tipos[imagenModalAbierto]?.cantidad || 0;
                                                const actual = (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0);
                                                if (totalSel >= maxPorReserva || totalSel >= totalDisponibles || actual >= disponiblesTipo) return;
                                                actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', actual + 1);
                                            }}
                                                disabled={
                                                    (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) >= (tipos[imagenModalAbierto]?.cantidad || 0) ||
                                                    totalSeleccionado >= CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA ||
                                                    totalSeleccionado >= totalDisponibles
                                                }
                                                className="w-10 h-10 flex-shrink-0 rounded bg-black text-white hover:bg-[#7a0202] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center">
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Botón guardar */}
                                    <button onClick={() => setImagenModalAbierto(null)} className="w-full py-3 rounded-lg bg-[#7a0202] text-white font-bold hover:bg-[#8b0303] transition">
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
