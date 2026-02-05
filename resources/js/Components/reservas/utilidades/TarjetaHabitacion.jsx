import {
    InformationCircleIcon,
    MinusIcon,
    PlusIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

export default function TarjetaHabitacion({
    tipo,
    info,
    isSelected,
    preciosPorTipo,
    actualizarSeleccionHabitacion,
    puedoSeleccionarMas,
    getImagen,
    setImagenModalAbierto,
    fullHeight = false,
}) {
    return (
        <article
            key={tipo}
            className={`tarjeta-habitacion group w-full flex flex-col min-h-0 rounded-xl border bg-white transition-all duration-300 md:flex-row overflow-hidden ${fullHeight ? 'md:h-28 md:h-32' : ''} ${isSelected ? 'border-[#7a0202] shadow-md ring-1 ring-[#7a0202]' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
        >
            <div className={`relative w-full shrink-0 rounded-lg bg-gray-900 ${fullHeight ? 'md:h-full md:w-44' : 'h-16 md:h-20 md:w-44'}`}>
                <img
                    src={getImagen(tipo)}
                    className="absolute inset-0 h-full w-full rounded-lg object-cover opacity-90"
                    alt={tipo}
                />
                <button
                    onClick={() => setImagenModalAbierto(tipo)}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity group-hover:opacity-100 md:opacity-0"
                >
                    <InformationCircleIcon className="h-6 w-6 text-white" />
                </button>
            </div>

            <div className={`flex flex-1 flex-col justify-center ${fullHeight ? 'p-3 md:p-4' : 'p-4'}`}>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                            {tipo}
                        </h4>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-gray-400">
                                <UsersIcon className="h-3 w-3" />{' '}
                                {info.capacidadMaxima} Capacidad
                            </span>
                        </div>
                    </div>

                    <div className="cta-row flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <div className="text-right">
                            <p className="text-lg font-black text-[#7a0202]">
                                {preciosPorTipo[tipo] ??
                                    info.precioEntreNoche ??
                                    info.precioTipo ??
                                    info.precioMinimo}
                                €
                            </p>
                            <p className="text-[7px] font-bold uppercase tracking-tighter text-gray-400">
                                Precio medio por noche
                            </p>
                        </div>

                        <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                            {isSelected ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            actualizarSeleccionHabitacion(
                                                tipo,
                                                'cantidad',
                                                0,
                                            )
                                        }
                                        className="p-2 text-gray-400 transition-colors hover:text-red-700"
                                    >
                                        <MinusIcon className="h-4 w-4 stroke-[3]" />
                                    </button>
                                    <span className="rounded border border-green-100 bg-green-50 px-3 py-1 text-[10px] font-black uppercase text-green-600">
                                        Listo
                                    </span>
                                </div>
                            ) : (
                                <button
                                    disabled={!puedoSeleccionarMas}
                                    onClick={() =>
                                        actualizarSeleccionHabitacion(
                                            tipo,
                                            'cantidad',
                                            1,
                                        )
                                    }
                                    className="cta-button flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#7a0202] active:scale-95 disabled:opacity-20"
                                >
                                    <PlusIcon className="h-3 w-3 stroke-[3]" />{' '}
                                    Seleccionar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
