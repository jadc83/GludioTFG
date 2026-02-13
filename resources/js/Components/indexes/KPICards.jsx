import { HomeIcon, ArrowTrendingUpIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function KPICards({ habitacionesTotales, ocupacionMedia, fDesdeCargada, fHastaCargada }) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="transition-hover rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-200">
                        <HomeIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase leading-none tracking-widest text-gray-400">Inventario</span>
                        <div className="mt-1 text-3xl font-black leading-tight text-gray-900">{habitacionesTotales}</div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7a0202] text-white shadow-lg shadow-red-100">
                        <ArrowTrendingUpIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase leading-none tracking-widest text-gray-400">Ocupación Media</span>
                        <div className="mt-1 text-3xl font-black leading-tight text-[#7a0202]">{ocupacionMedia}%</div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
                        <ChartBarIcon className="h-6 w-6" />
                    </div>
                    <div className="overflow-hidden">
                        <span className="text-[10px] font-black uppercase leading-none tracking-widest">Análisis</span>
                        <div className="mt-2 truncate text-[13px] font-black uppercase tracking-tighter text-gray-900">{fDesdeCargada} — {fHastaCargada}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
