import Boton from '@/Components/UI/Boton';
import { CalendarIcon } from '@heroicons/react/24/outline';

export default function StatsFilters({ fechaDesde, fechaHasta, onFechaChange, onBuscar, cargando }) {
    return (
        <div className="flex flex-col items-end gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all md:flex-row">
            <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label htmlFor="fecha-desde" className="ml-2 text-[10px] font-black uppercase text-gray-400">Fecha Inicio</label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input id="fecha-desde" type="date" value={fechaDesde} onChange={(e) => onFechaChange?.('desde', e.target.value)} className="w-full rounded-xl border-none bg-gray-50 py-3 pl-10 text-sm font-bold text-gray-700 transition focus:ring-2 focus:ring-[#7a0202]/10" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label htmlFor="fecha-hasta" className="ml-2 text-[10px] font-black uppercase text-gray-400">Fecha Fin</label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input id="fecha-hasta" type="date" value={fechaHasta} onChange={(e) => onFechaChange?.('hasta', e.target.value)} className="w-full rounded-xl border-none bg-gray-50 py-3 pl-10 text-sm font-bold text-gray-700 transition focus:ring-2 focus:ring-[#7a0202]/10" />
                    </div>
                </div>
            </div>
            <Boton onClick={onBuscar} loading={cargando} disabled={cargando} className="h-[46px] w-full md:w-auto">Generar Reporte</Boton>
        </div>
    );
}
