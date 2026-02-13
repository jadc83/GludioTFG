import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { InboxIcon } from '@heroicons/react/24/outline';

export default function LoadingEmpty({ cargando, datos }) {
    if (cargando) {
        return (
            <div className="py-20 text-center">
                <LoadingSpinner />
                <span className="mt-4 block text-[10px] font-black uppercase tracking-widest text-gray-300">Consultando métricas...</span>
            </div>
        );
    }

    if (!datos) {
        return (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                <InboxIcon className="mx-auto mb-4 h-12 w-12 text-gray-200" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Sin datos seleccionados</h3>
                <p className="mx-auto mt-1 max-w-xs text-xs italic text-gray-400">Define un rango de fechas en la barra superior para procesar las estadísticas.</p>
            </div>
        );
    }

    return null;
}
