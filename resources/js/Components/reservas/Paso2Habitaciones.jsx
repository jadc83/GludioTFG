import PrimaryButton from '../PrimaryButton';

export default function Paso2Habitaciones({
    estaCargandoHabitaciones, habitacionesSeleccionadas, agruparHabitacionesPorTipo, getImagen,
    actualizarSeleccionHabitacion, getTotalHabitaciones, avanzarPaso, retrocederPaso
}) {
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
                                <div key={tipo} className={`group relative overflow-hidden rounded-lg bg-white transition-all duration-200 ${isSelected ? 'tarjeta-seleccionada shadow-lg ring-2 ring-opacity-50' : 'shadow hover:shadow-md'}`}>
                                    {isSelected && <div className="barra-acento absolute left-0 right-0 top-0 h-0.5"></div>}
                                    <div className="relative h-28 overflow-hidden">
                                        <img src={getImagen(tipo)} alt={`Habitación ${tipo}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                            <h4 className="mb-0 text-base font-bold text-white drop-shadow-lg">{tipo}</h4>
                                            <div className="flex items-center gap-1 text-[10px] text-white/90">
                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                                </svg>
                                                <span>{info.capacidadMaxima} {info.capacidadMaxima === 1 ? 'persona' : 'personas'}</span>
                                            </div>
                                        </div>
                                        {info.precioMinimo && (
                                            <div className="absolute right-1.5 top-1.5 rounded bg-white px-1.5 py-0.5 shadow">
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="precio-min text-sm font-black">{info.precioMinimo}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">€</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <div className="rounded-lg bg-gray-50 p-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col items-center">
                                                    <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Habitaciones</label>
                                                    <div className="join">
                                                        <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', Math.max(0, (habitacionesSeleccionadas[tipo]?.cantidad || 0) - 1))} disabled={(habitacionesSeleccionadas[tipo]?.cantidad || 0) === 0} className={`btn btn-sm min-w-[3rem] text-lg font-bold join-item ${(habitacionesSeleccionadas[tipo]?.cantidad || 0) === 0 ? 'boton-deshabilitado' : 'boton-activo'}`}>−</button>
                                                        <span className="numero-unidad flex items-center justify-center border-y border-gray-300 bg-white px-4 text-lg font-black join-item">{habitacionesSeleccionadas[tipo]?.cantidad || 0}</span>
                                                        <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', Math.min(Math.min(info.cantidad, 5), (habitacionesSeleccionadas[tipo]?.cantidad || 0) + 1))} disabled={(habitacionesSeleccionadas[tipo]?.cantidad || 0) >= Math.min(info.cantidad, 5)} className={`btn btn-sm min-w-[3rem] text-lg font-bold join-item ${(habitacionesSeleccionadas[tipo]?.cantidad || 0) >= Math.min(info.cantidad, 5) ? 'boton-deshabilitado' : 'boton-activo'}`}>+</button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Huéspedes</label>
                                                    <div className="join">
                                                        <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'personas', Math.max(1, (habitacionesSeleccionadas[tipo]?.personas || 1) - 1))} disabled={!isSelected || (habitacionesSeleccionadas[tipo]?.personas || 1) === 1} className={`btn btn-sm min-w-[3rem] text-lg font-bold join-item ${!isSelected || (habitacionesSeleccionadas[tipo]?.personas || 1) === 1 ? 'boton-deshabilitado' : 'boton-activo'}`}>−</button>
                                                        <span className="numero-unidad flex items-center justify-center border-y border-gray-300 bg-white px-4 text-lg font-black join-item">{habitacionesSeleccionadas[tipo]?.personas || 1}</span>
                                                        <button type="button" onClick={() => actualizarSeleccionHabitacion(tipo, 'personas', Math.min(info.capacidadMaxima, (habitacionesSeleccionadas[tipo]?.personas || 1) + 1))} disabled={!isSelected || (habitacionesSeleccionadas[tipo]?.personas || 1) >= info.capacidadMaxima} className={`btn btn-sm min-w-[3rem] text-lg font-bold join-item ${!isSelected || (habitacionesSeleccionadas[tipo]?.personas || 1) >= info.capacidadMaxima ? 'boton-deshabilitado' : 'boton-activo'}`}>+</button>
                                                    </div>
                                                </div>
                                            </div>
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
                    <PrimaryButton onClick={retrocederPaso} className="px-6">← Atrás</PrimaryButton>
                    <PrimaryButton onClick={avanzarPaso} disabled={getTotalHabitaciones() === 0} className="px-8">Continuar →</PrimaryButton>
                </div>
            </footer>
        </div>
    );
}
