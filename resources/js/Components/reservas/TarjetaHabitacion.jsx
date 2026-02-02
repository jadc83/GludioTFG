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
}) {
    return (
        <article
            key={tipo}
            className={`group flex flex-col rounded-xl border bg-white transition-all duration-300 md:flex-row ${isSelected ? 'border-[#7a0202] shadow-md ring-1 ring-[#7a0202]' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
        >
            <div className="relative h-28 w-full shrink-0 rounded-lg bg-gray-900 md:h-32 md:w-48">
                <img
                    src={getImagen(tipo)}
                    className="h-full w-full rounded-lg object-cover opacity-90"
                    alt={tipo}
                />
                <button
                    onClick={() => setImagenModalAbierto(tipo)}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity group-hover:opacity-100 md:opacity-0"
                >
                    <InformationCircleIcon className="h-6 w-6 text-white" />
                </button>
            </div>

            <div className="flex flex-1 flex-col justify-center p-4">
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

                    <div className="flex items-center gap-6">
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
                                    className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#7a0202] active:scale-95 disabled:opacity-20"
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
