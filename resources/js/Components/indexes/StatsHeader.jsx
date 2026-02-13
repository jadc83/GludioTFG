import { PresentationChartLineIcon } from '@heroicons/react/24/outline';

export default function StatsHeader() {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                    Estadísticas y <span className="text-[#7a0202]">Análisis</span>
                </h1>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Panel de métricas y rendimiento operativo
                </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                <PresentationChartLineIcon className="h-6 w-6 text-gray-400" />
            </div>
        </div>
    );
}
