import {
    InformationCircleIcon,
    MinusIcon,
    PlusIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { t } from '@/i18n';

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
        <article className={`tarjeta-habitacion group w-full overflow-hidden rounded-lg border ${isSelected ? 'border-[#7a0202] shadow-md' : 'border-gray-200 shadow-sm'} bg-white`}>
            <div className="relative w-full h-28 sm:h-24 md:h-20 bg-gray-100">
                <img src={getImagen(tipo)} alt={tipo} className="w-full h-full object-cover" />
                <button onClick={() => setImagenModalAbierto(tipo)} className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white">
                    <InformationCircleIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="p-3 md:flex md:items-center md:justify-between">
                <div>
                    <h4 className="text-sm font-bold text-gray-900 capitalize">{tipo}</h4>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <UsersIcon className="h-4 w-4" />
                        <span>{(info.capacidadMaxima ?? info.capacidad) || '—'} {t('paso2.persons')}</span>
                    </div>
                    {info.descripcion && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{info.descripcion}</p>}
                </div>
                <div className="mt-2 flex items-center justify-between md:mt-0 md:flex-col md:items-end md:gap-2 min-h-[56px]">
                    <div className="text-right">
                        <div className="text-base font-extrabold text-[#7a0202]">
                            {preciosPorTipo[tipo] ?? info.precioEntreNoche ?? info.precioTipo ?? info.precioMinimo}€
                        </div>
                        <div className="text-xs text-gray-400">{t('paso2.price_per_night')}</div>
                    </div>

                    <div className="ml-4 md:ml-0">
                        {isSelected ? (
                                <div className="flex items-center gap-2">
                                <button onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', 0)} className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-bold text-[#7a0202]">{t('paso2.remove')}</button>
                                <span className="inline-flex h-10 items-center justify-center rounded-md bg-green-50 px-4 text-sm font-bold text-green-700">{t('paso2.selected')}</span>
                            </div>
                        ) : (
                            <button disabled={!puedoSeleccionarMas} onClick={() => actualizarSeleccionHabitacion(tipo, 'cantidad', 1)} className="inline-flex h-10 items-center justify-center rounded-md bg-[#7a0202] hover:bg-[#5f0101] px-4 text-sm font-bold text-white disabled:opacity-40">{t('paso2.select')}</button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
