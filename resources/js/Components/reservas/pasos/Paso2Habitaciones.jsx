import { useState } from 'react';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Paso2Habitaciones({
    estaCargandoHabitaciones, habitacionesSeleccionadas, agruparHabitacionesPorTipo, getImagen,
    actualizarSeleccionHabitacion, getTotalHabitaciones, getTotalDisponibles, avanzarPaso, retrocederPaso
}) {
    const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
    const totalDisponibles = getTotalDisponibles();
    const totalSeleccionado = getTotalHabitaciones();
    const puedoSeleccionarMas = totalSeleccionado < totalDisponibles && totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;

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

    return (
        <div className="flex h-full flex-col bg-gris">
            <header className="bg-gris px-3 md:px-4 pb-2 pt-3">
                <h3 className="titulo-rojo titulo-espaciado mb-1 text-center text-sm md:text-lg font-bold">Selecciona tus habitaciones</h3>
                <Migitas />
            </header>

            <main className="flex-1 overflow-y-auto bg-gris px-2 md:px-3 py-2">
                {estaCargandoHabitaciones ? (
                    <div className="flex h-full flex-col items-center justify-center gap-6 py-12">
                        <div className="flex flex-col items-center gap-4">
                            <span className="spinner-rojo loading loading-spinner loading-lg"></span>
                            <p className="text-sm font-medium text-gray-600">Buscando disponibilidad...</p>
                            <div className="w-48">
                                <progress className="progress progress-warning w-full" value="100"></progress>
                            </div>
                            <p className="text-xs text-gray-400">Por favor espera...</p>
                        </div>
                    </div>
                ) : Object.keys(agruparHabitacionesPorTipo()).length === 0 ? (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
                        <p className="text-lg text-gray-600">No hay habitaciones disponibles</p>
                        <p className="mt-2 text-sm text-gray-400">Intenta con otras fechas</p>
                    </div>
                ) : (
                    <>
                        {/* Indicador de límite */}
                        {totalSeleccionado > 0 && (
                            <div className={`mb-4 rounded-lg p-3 text-sm font-medium ${
                                totalSeleccionado >= CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA || totalSeleccionado >= totalDisponibles
                                    ? 'bg-red-100 text-[#7a0202] border border-[#7a0202]'
                                    : 'bg-blue-100 text-blue-700 border border-blue-300'
                            }`}>
                                Habitaciones seleccionadas: <span className="font-bold">{totalSeleccionado}</span> / {totalDisponibles} disponibles (máx. {CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA})
                                {totalSeleccionado >= CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA && (
                                    <span className="ml-2">Límite alcanzado</span>
                                )}
                                {totalSeleccionado >= totalDisponibles && totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA && (
                                    <span className="ml-2">Todas reservadas</span>
                                )}
                            </div>
                        )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                        {Object.entries(agruparHabitacionesPorTipo()).map(([tipo, info]) => {
                            const isSelected = habitacionesSeleccionadas[tipo]?.cantidad > 0;
                            const puedeAgregarMas = puedoSeleccionarMas || isSelected;
                            return (
                                <div key={tipo} className={`group relative overflow-hidden rounded-lg transition-all duration-200 ${isSelected ? 'tarjeta-seleccionada shadow-lg ring-2 ring-opacity-50' : 'shadow hover:shadow-md'} ${!puedeAgregarMas ? 'opacity-60' : ''}`}>
                                    {isSelected && <div className="barra-acento absolute left-0 right-0 top-0 h-0.5"></div>}
                                    <div className="flex flex-col items-center justify-center gap-3 p-3">
                                        {/* Imagen cuadrada */}
                                        <div className="h-32 w-full overflow-hidden rounded-md bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setImagenModalAbierto(tipo)}>
                                            {getImagen(tipo) ? (
                                                <img src={getImagen(tipo)} alt={tipo} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                                                    <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Nombre y detalles */}
                                        <div className="flex flex-col gap-1 flex-1 text-center">
                                            <h4 className="text-sm font-bold text-gray-900">{tipo}</h4>
                                            <div className="flex flex-col items-center gap-1 text-xs text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                                    </svg>
                                                    <span>{info.capacidadMaxima}p</span>
                                                </div>
                                                {info.precioMinimo && (
                                                    <div className="flex items-baseline gap-0.5">
                                                        <span className="precio-min font-black">{info.precioMinimo}€</span>
                                                        <span>/noche</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Controles Habitaciones */}
                                        <div className="w-full">{isSelected ?
                                            (   <button type="button" disabled className="btn btn-sm btn-block text-xs bg-gray-300 text-gray-600 cursor-not-allowed">
                                                    Elegida
                                                </button>
                                            ) : (
                                                <button type="button" disabled={!puedeAgregarMas} onClick={() => {actualizarSeleccionHabitacion(tipo, 'cantidad', (habitacionesSeleccionadas[tipo]?.cantidad || 0) + 1);
                                                    avanzarPaso();}} className={`btn btn-sm btn-block text-xs inline-flex items-center justify-center rounded-md border border-transparent text-white transition duration-150 ease-in-out ${
                                                    puedeAgregarMas
                                                        ? 'bg-black hover:bg-[#7a0202] focus:bg-[#7a0202] focus:outline-none focus:ring-2 focus:ring-[#920303] focus:ring-offset-2 active:bg-[#6b0101]'
                                                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                }`}  >
                                                    {puedeAgregarMas ? 'Quiero esta' : 'Límite alcanzado'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
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
                    <div className="relative w-full max-w-4xl rounded-lg bg-white mb-12" onClick={(e) => e.stopPropagation()}>
                        {/* Botón cerrar */}
                        <button onClick={() => setImagenModalAbierto(null)}
                            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#7a0202] text-xl font-bold text-white shadow-md hover:bg-[#8b0303]">
                            ✕
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8">
                            {/* Galería y descripción */}
                            <div className="col-span-1 md:col-span-2">
                                {/* Foto principal */}
                                <div className="mb-4 md:mb-6 rounded-lg overflow-hidden bg-gray-100 aspect-video">
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
                                <div className="rounded-lg border border-gray-200 p-3 md:p-5 shadow-sm md:sticky md:top-28 bg-gray-50">
                                    {/* Título */}
                                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-5">{imagenModalAbierto}</h3>

                                    {/* Capacidad */}
                                    <div className="mb-5 pb-5 border-b border-gray-200">
                                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Capacidad máxima</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {agruparHabitacionesPorTipo()[imagenModalAbierto]?.capacidadMaxima}
                                            <span className="text-sm font-normal text-gray-600 ml-1">personas</span>
                                        </p>
                                    </div>

                                    {/* Disponibles */}
                                    <div className="mb-5 pb-5 border-b border-gray-200">
                                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Disponibles ahora</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {agruparHabitacionesPorTipo()[imagenModalAbierto]?.cantidad}
                                            <span className="text-sm font-normal text-gray-600 ml-1">disponibles</span>
                                        </p>
                                    </div>

                                    {/* Precio */}
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Desde</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-[#7a0202]">{agruparHabitacionesPorTipo()[imagenModalAbierto]?.precioMinimo || '—'}</span>
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
                                            <input type="number" readOnly className="flex-1 min-w-0 px-2 text-center border border-gray-300 rounded font-bold text-lg bg-white"
                                                value={habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0}/>
                                            <button type="button" onClick={() => actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) + 1)}
                                                disabled={(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) >= agruparHabitacionesPorTipo()[imagenModalAbierto]?.cantidad}
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
