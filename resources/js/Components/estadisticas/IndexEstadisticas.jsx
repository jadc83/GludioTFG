import React, { Suspense, useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    ChartBarIcon,
    CalendarIcon,
    ArrowTrendingUpIcon,
    InboxIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    HomeIcon,
    PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function IndexEstadisticas({
    cargando = false,
    datos = null,
    mostrarGrafico = false,
    // Props para controlar el buscador desde el padre
    fechaDesde = '',
    fechaHasta = '',
    onFechaChange = null,
    onBuscar = null
}) {
    const [mostrarDetallesTabla, setMostrarDetallesTabla] = useState(false);

    // --- PROCESAMIENTO DE DATOS ---
    const {
        total_habitaciones: habitacionesTotales,
        total_por_tipo: totalPorTipo = {},
        promedio_porcentaje_ocupacion: ocupacionMedia,
        promedio_porcentaje_ocupacion_por_tipo: promedioPorTipo = {},
        por_dia: porDia = [],
        fecha_desde: fDesdeCargada,
        fecha_hasta: fHastaCargada
    } = datos || {};

    // 1. Eje X: Solo el número del día
    const categoriasDía = useMemo(() => porDia.map(d => dayjs(d.fecha).format('D')), [porDia]);

    // 2. Etiqueta de Mes/Meses para la gráfica
    const mesesLabel = useMemo(() => {
        if (porDia.length === 0) return '';
        const meses = [...new Set(porDia.map(d => dayjs(d.fecha).format('MMMM YYYY')))];
        return meses.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' — ');
    }, [porDia]);

    const tipos = ['doble', 'familiar', 'suite'];
    const coloresTipos = [
        { main: '#7a0202', bg: 'rgba(122,2,2,0.1)' },
        { main: '#02357a', bg: 'rgba(2,53,122,0.1)' },
        { main: '#027a2f', bg: 'rgba(2,122,64,0.1)' }
    ];

    const datosGrafico = {
        labels: categoriasDía,
        datasets: tipos.map((t, i) => ({
            label: t.toUpperCase(),
            data: porDia.map(d => d.por_tipo?.[t]?.porcentaje ?? 0),
            fill: true,
            backgroundColor: coloresTipos[i].bg,
            borderColor: coloresTipos[i].main,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
        }))
    };

    const opcionesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: 'bold' }, color: '#9ca3af' }
            },
            y: {
                min: 0, max: 100,
                ticks: { callback: val => `${val}%`, font: { size: 10, weight: 'bold' }, color: '#9ca3af' },
                grid: { color: '#f3f4f6' }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#111827',
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    title: (context) => dayjs(porDia[context[0].dataIndex].fecha).format('DD [de] MMMM, YYYY'),
                    label: ctx => ` Ocupación: ${ctx.parsed.y}%`
                }
            }
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* --- 1. ENCABEZADO PREMIUM (ESTILO REEMBOLSOS) --- */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        Estadísticas y <span className="text-[#7a0202]">Análisis</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Panel de métricas y rendimiento operativo
                    </p>
                </div>
                <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                    <PresentationChartLineIcon className="h-6 w-6 text-gray-400" />
                </div>
            </div>

            {/* --- 2. BUSCADOR INTEGRADO (ESTILO CLIENTES) --- */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end transition-all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Fecha Inicio</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => onFechaChange?.('desde', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Fecha Fin</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => onFechaChange?.('hasta', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10 transition"
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={onBuscar}
                    className="w-full md:w-auto px-10 py-3 bg-[#7a0202] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5a0101] transition shadow-lg shadow-red-100 h-[46px]"
                >
                    Generar Reporte
                </button>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            {cargando ? (
                <div className="py-20 text-center animate-pulse">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Consultando métricas...</span>
                </div>
            ) : !datos ? (
                <div className="bg-white rounded-3xl border border-gray-200 border-dashed p-16 text-center">
                    <InboxIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Sin datos seleccionados</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto italic">Define un rango de fechas en la barra superior para procesar las estadísticas.</p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm transition-hover hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                                    <HomeIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Inventario</span>
                                    <div className="text-3xl font-black text-gray-900 leading-tight mt-1">{habitacionesTotales}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-[#7a0202] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-100">
                                    <ArrowTrendingUpIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Ocupación Media</span>
                                    <div className="text-3xl font-black text-[#7a0202] leading-tight mt-1">{ocupacionMedia}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4 text-gray-400">
                                <div className="h-12 w-12 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                                    <ChartBarIcon className="h-6 w-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Análisis</span>
                                    <div className="text-[13px] font-black text-gray-900 truncate mt-2 uppercase tracking-tighter">
                                        {fDesdeCargada} — {fHastaCargada}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfica con Eje X simplificado */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                            <div>
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Curva de Ocupación Diaria</h3>
                                <div className="mt-2 inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Mes: <span className="ml-1 text-gray-900">{mesesLabel}</span>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                {tipos.map((t, i) => (
                                    <div key={t} className="flex items-center gap-2.5">
                                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: coloresTipos[i].main }} />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            {mostrarGrafico ? (
                                <Line data={datosGrafico} options={opcionesGrafico} />
                            ) : (
                                <div className="h-full border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 font-bold uppercase text-[10px] tracking-[0.3em]">
                                    Gráfico pendiente de carga
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Registro Detallado */}
                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                        <button
                            onClick={() => setMostrarDetallesTabla(!mostrarDetallesTabla)}
                            className="w-full px-8 py-5 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Registro Detallado por Fecha</span>
                            {mostrarDetallesTabla ? <ChevronUpIcon className="h-4 w-4 text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
                        </button>

                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${mostrarDetallesTabla ? 'max-h-[5000px]' : 'max-h-0'}`}>
                            <div className="p-4 md:p-8 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Día</th>
                                            {tipos.map((t, i) => (
                                                <th key={t} className="pb-4 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: coloresTipos[i].main }}>
                                                    {t}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {porDia.map((d) => (
                                            <tr key={d.fecha} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="py-4 px-4 font-mono text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
                                                    {dayjs(d.fecha).format('DD MMM')}
                                                </td>
                                                {tipos.map((t, i) => {
                                                    const pct = d.por_tipo?.[t]?.porcentaje ?? 0;
                                                    return (
                                                        <td key={t} className="py-4 px-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-xs font-black text-gray-900 mb-1">{pct}%</div>
                                                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div className="h-full" style={{ width: `${pct}%`, backgroundColor: coloresTipos[i].main }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
