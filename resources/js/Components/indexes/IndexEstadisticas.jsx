import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useMemo } from 'react';

import StatsHeader from '@/Components/indexes/StatsHeader';
import StatsFilters from '@/Components/indexes/StatsFilters';
import KPICards from '@/Components/indexes/KPICards';
import FinanceCards from '@/Components/indexes/FinanceCards';
import OccupationChart from '@/Components/indexes/OccupationChart';
import DetailedTable from '@/Components/indexes/DetailedTable';
import LoadingEmpty from '@/Components/indexes/LoadingEmpty';

dayjs.locale('es');

export default function IndexEstadisticas({
    cargando = false,
    datos = null,
    mostrarGrafico = false,
    finanzas = null,
    fechaDesde = '',
    fechaHasta = '',
    onFechaChange = null,
    onBuscar = null,
}) {
    const {
        total_habitaciones: habitacionesTotales,
        promedio_porcentaje_ocupacion: ocupacionMedia,
        por_dia: porDiaRaw,
        fecha_desde: fDesdeCargada,
        fecha_hasta: fHastaCargada,
    } = datos || {};

    const porDia = useMemo(() => porDiaRaw ?? [], [porDiaRaw]);

    const mesesLabel = useMemo(() => {
        if (porDia.length === 0) return '';
        const meses = [...new Set(porDia.map((d) => dayjs(d.fecha).format('MMMM YYYY')))];
        return meses.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' — ');
    }, [porDia]);

    const tipos = ['doble', 'familiar', 'suite'];
    const coloresTipos = [
        { main: '#7a0202' },
        { main: '#02357a' },
        { main: '#027a2f' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <StatsHeader />

            <StatsFilters fechaDesde={fechaDesde} fechaHasta={fechaHasta} onFechaChange={onFechaChange} onBuscar={onBuscar} cargando={cargando} />

            <LoadingEmpty cargando={cargando} datos={datos} />

            {(!cargando && datos) && (
                <>
                    <KPICards habitacionesTotales={habitacionesTotales} ocupacionMedia={ocupacionMedia} fDesdeCargada={fDesdeCargada} fHastaCargada={fHastaCargada} />

                    <FinanceCards finanzas={finanzas} />

                    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Curva de Ocupación Diaria</h3>
                                <div className="mt-2 inline-flex items-center rounded border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Mes: <span className="ml-1 text-gray-900">{mesesLabel}</span></div>
                            </div>

                            <div className="flex gap-6">
                                {tipos.map((t, i) => (
                                    <div key={t} className="flex items-center gap-2.5">
                                        <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: coloresTipos[i].main }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <OccupationChart porDia={porDia} mostrarGrafico={mostrarGrafico} />
                    </div>

                    <DetailedTable porDia={porDia} tipos={tipos} />
                </>
            )}
        </div>
    );
}
