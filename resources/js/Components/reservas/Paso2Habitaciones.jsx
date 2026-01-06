import { useState } from 'react';
import PrimaryButton from '../PrimaryButton';

export default function Paso2Habitaciones({
    estaCargandoHabitaciones, habitacionesSeleccionadas, agruparHabitacionesPorTipo, getImagen,
    actualizarSeleccionHabitacion, getTotalHabitaciones, avanzarPaso, retrocederPaso
}) {
    const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
    const Migitas = () => (
        <nav aria-label="Progreso de reserva" className="mx-auto mb-4 flex max-w-md justify-center space-x-2 rounded bg-gris p-2 text-sm">
            {['Fechas', 'Habitación', 'Datos', 'Confirmar'].map((etiqueta, i) => (
                <span key={i} className={`rounded-md px-3 py-1 ${i === 1 ? 'bg-black text-white' : 'bg-gris text-black'}`}>{etiqueta}</span>
            ))}
        </nav>
    );

    return (
        <div className="flex h-full flex-col bg-gris">
            <header className="bg-gris px-4 pb-3 pt-4">
                <h3 className="titulo-rojo titulo-espaciado mb-2 text-center text-xl font-bold">Selecciona tus habitaciones</h3>
                <Migitas />
            </header>

            <main className="flex-1 overflow-y-auto bg-gris px-3 py-2">
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
                    <div className="space-y-2">
                        {Object.entries(agruparHabitacionesPorTipo()).map(([tipo, info]) => {
                            const isSelected = habitacionesSeleccionadas[tipo]?.cantidad > 0;
                            return (
                                <div key={tipo} className={`group relative overflow-hidden rounded-lg transition-all duration-200 ${isSelected ? 'tarjeta-seleccionada shadow-lg ring-2 ring-opacity-50' : 'shadow hover:shadow-md'}`}>
                                    {isSelected && <div className="barra-acento absolute left-0 right-0 top-0 h-0.5"></div>}
                                    <div className="flex items-center justify-between gap-4 p-3">
                                        {/* Imagen cuadrada */}
                                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setImagenModalAbierto(tipo)}>
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
                                        <div className="flex flex-col gap-1 flex-1">
                                            <h4 className="text-base font-bold text-gray-900">{tipo}</h4>
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
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
                                        <div className="flex flex-col items-center gap-1">{isSelected ?
                                            (   <button type="button" disabled className="btn btn-sm px-4 bg-gray-300 text-gray-600 cursor-not-allowed">
                                                    Elegida
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => {actualizarSeleccionHabitacion(tipo, 'cantidad', (habitacionesSeleccionadas[tipo]?.cantidad || 0) + 1);
                                                    avanzarPaso();}} className="inline-flex items-center justify-center rounded-md border border-transparent bg-black px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-[#7a0202] focus:bg-[#7a0202] focus:outline-none focus:ring-2 focus:ring-[#920303] focus:ring-offset-2 active:bg-[#6b0101]">
                                                    Quiero esta
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <footer className="border-t border-gray-300 bg-gris px-4 py-3">
                <div className="flex items-center justify-between gap-3">
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
                <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/75 overflow-y-auto pt-[60px]" onClick={() => setImagenModalAbierto(null)}>
                    <div className="relative w-11/12 max-w-7xl rounded-lg bg-gris" onClick={(e) => e.stopPropagation()}>
                        {/* Botón cerrar */}
                        <button onClick={() => setImagenModalAbierto(null)}
                            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl font-bold text-gray-500 shadow-md hover:bg-gray-100 hover:text-gray-700">
                            ✕
                        </button>

                        <div className="grid grid-cols-4 gap-4 p-6">
                            {/* Galería de fotos */}
                            <div className="col-span-3">
                                <div className="mb-6 rounded-lg bg-gris p-6 text-center">
                                    <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 py-32 text-gray-500">
                                        <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">Foto principal (1/4)</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {[2, 3, 4].map((num) => (
                                        <div key={num} className="aspect-square rounded-lg bg-gris p-4">
                                            <div className="flex h-full items-center justify-center rounded bg-gradient-to-br from-gray-300 to-gray-400">
                                                <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Descripción */}
                                <div className="mt-8">
                                    <h3 className="mb-3 text-lg font-bold text-gray-900">Acerca de esta habitación</h3>
                                    <p className="mb-4 text-gray-700">
                                        Una habitación espaciosa y luminosa con vistas al jardín. Ideal para parejas o viajeros en solitario que buscan confort y tranquilidad. Perfectamente equipada con todas las comodidades modernas para una estancia memorable.
                                    </p>
                                    <p className="text-gray-600">
                                        La habitación cuenta con aire acondicionado, WiFi de alta velocidad, escritorio de trabajo y un baño privado completamente renovado.
                                    </p>
                                </div>

                                {/* Servicios */}
                                <div className="mt-8">
                                    <h3 className="mb-4 text-lg font-bold text-gray-900">Servicios</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { icon: '🛏️', name: 'Cama king' },
                                            { icon: '🌡️', name: 'Aire acondicionado' },
                                            { icon: '📺', name: 'Smart TV' },
                                            { icon: '🛁', name: 'Baño privado' },
                                            { icon: '📶', name: 'WiFi gratis' },
                                            { icon: '🧴', name: 'Servicios de limpieza' },
                                        ].map((servicio, idx) => (
                                            <div key={idx} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                                                <span className="text-2xl">{servicio.icon}</span>
                                                <span className="text-sm font-medium text-gray-700">{servicio.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Política de cancelación */}
                                <div className="mt-8">
                                    <h3 className="mb-3 text-lg font-bold text-gray-900">Política de cancelación</h3>
                                    <div className="rounded-lg bg-blue-50 p-4">
                                        <p className="text-sm text-blue-900">
                                            <span className="font-bold">Cancelación flexible:</span> Cancela hasta 7 días antes de tu llegada y recibe un reembolso completo.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Panel lateral - Información de reserva */}
                            <div className="col-span-1">
                                <div className="rounded-lg border border-gray-200 p-6 shadow-sm">
                                    {/* Rating */}
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className="text-lg">★</span>
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">4.8</span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-600">Basado en 124 reseñas</p>
                                    </div>

                                    {/* Precio */}
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Precio por noche</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-red-700">85€</span>
                                            <span className="text-sm text-gray-600">/noche</span>
                                        </div>
                                    </div>

                                    {/* Desglose */}
                                    <div className="mb-6 rounded-lg bg-gray-50 p-4">
                                        <p className="mb-3 text-xs font-semibold uppercase text-gray-500">Ejemplo (7 noches)</p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">7 noches × 85€</span>
                                                <span className="font-bold text-gray-900">595€</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Tasas y cuotas</span>
                                                <span className="font-bold text-gray-900">59€</span>
                                            </div>
                                            <div className="border-t border-gray-300 pt-2">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-gray-900">Total</span>
                                                    <span className="text-lg font-bold text-red-700">654€</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información de capacidad */}
                                    <div className="mb-6 rounded-lg bg-blue-50 p-4">
                                        <p className="mb-3 text-xs font-semibold uppercase text-gray-600">Cantidad de habitaciones</p>
                                        <div className="flex flex-col items-center gap-3 mb-6">
                                            <div className="join">
                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', Math.max(0, (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) - 1))} disabled={(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) === 0} className={`btn btn-sm min-w-[3rem] join-item ${(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) === 0 ? 'boton-deshabilitado' : 'boton-activo'}`}>−</button>
                                                <span className="numero-unidad flex items-center justify-center border-y border-gray-300 bg-white px-4 text-lg font-black join-item">{habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0}</span>
                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', Math.min(Math.min(agruparHabitacionesPorTipo()[imagenModalAbierto]?.cantidad, 5), (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) + 1))} disabled={(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) >= Math.min(agruparHabitacionesPorTipo()[imagenModalAbierto]?.cantidad, 5)} className={`btn btn-sm min-w-[3rem] join-item ${(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) >= Math.min(agruparHabitacionesPorTipo()[imagenModalAbierto]?.cantidad, 5) ? 'boton-deshabilitado' : 'boton-activo'}`}>+</button>
                                            </div>
                                        </div>

                                        <p className="mb-3 text-xs font-semibold uppercase text-gray-600">Huéspedes</p>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="join">
                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(imagenModalAbierto, 'personas', Math.max(1, (habitacionesSeleccionadas[imagenModalAbierto]?.personas || 1) - 1))} disabled={(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) === 0 || (habitacionesSeleccionadas[imagenModalAbierto]?.personas || 1) === 1} className={`btn btn-sm min-w-[3rem] join-item ${(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) === 0 || (habitacionesSeleccionadas[imagenModalAbierto]?.personas || 1) === 1 ? 'boton-deshabilitado' : 'boton-activo'}`}>−</button>
                                                <span className="numero-unidad flex items-center justify-center border-y border-gray-300 bg-white px-4 text-lg font-black join-item">{habitacionesSeleccionadas[imagenModalAbierto]?.personas || 1}</span>
                                                <button type="button" onClick={() => actualizarSeleccionHabitacion(imagenModalAbierto, 'personas', Math.min(agruparHabitacionesPorTipo()[imagenModalAbierto]?.capacidadMaxima, (habitacionesSeleccionadas[imagenModalAbierto]?.personas || 1) + 1))} disabled={(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) === 0 || (habitacionesSeleccionadas[imagenModalAbierto]?.personas || 1) >= agruparHabitacionesPorTipo()[imagenModalAbierto]?.capacidadMaxima} className={`btn btn-sm min-w-[3rem] join-item ${(habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) === 0 || (habitacionesSeleccionadas[imagenModalAbierto]?.personas || 1) >= agruparHabitacionesPorTipo()[imagenModalAbierto]?.capacidadMaxima ? 'boton-deshabilitado' : 'boton-activo'}`}>+</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón seleccionar */}
                                    <button
                                        onClick={() => {
                                            actualizarSeleccionHabitacion(imagenModalAbierto, 'cantidad', (habitacionesSeleccionadas[imagenModalAbierto]?.cantidad || 0) + 1);
                                            setImagenModalAbierto(null);
                                        }}
                                        className="w-full rounded-lg bg-red-700 py-3 text-center font-bold text-white transition-colors hover:bg-red-800"
                                    >
                                        Agregar a mi reserva
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
