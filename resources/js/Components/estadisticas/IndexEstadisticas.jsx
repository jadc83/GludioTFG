import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import {
    ArrowTrendingUpIcon,
    CalendarIcon,
    ChartBarIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    HomeIcon,
    InboxIcon,
    PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

dayjs.locale('es');

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
);

export default function IndexEstadisticas({
    cargando = false,
    datos = null,
    mostrarGrafico = false,
    // Props para controlar el buscador desde el padre
    fechaDesde = '',
    fechaHasta = '',
    onFechaChange = null,
    onBuscar = null,
}) {
    const [mostrarDetallesTabla, setMostrarDetallesTabla] = useState(false);

    // --- PROCESAMIENTO DE DATOS ---
    const {
        total_habitaciones: habitacionesTotales,
        promedio_porcentaje_ocupacion: ocupacionMedia,
        por_dia: porDiaRaw,
        fecha_desde: fDesdeCargada,
        fecha_hasta: fHastaCargada,
    } = datos || {};

    const porDia = porDiaRaw ?? [];

    // 1. Eje X: Solo el número del día
    const categoriasDía = useMemo(
        () => porDia.map((d) => dayjs(d.fecha).format('D')),
        [porDia],
    );

    // 2. Etiqueta de Mes/Meses para la gráfica
    const mesesLabel = useMemo(() => {
        if (porDia.length === 0) return '';
        const meses = [
            ...new Set(porDia.map((d) => dayjs(d.fecha).format('MMMM YYYY'))),
        ];
        return meses
            .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
            .join(' — ');
    }, [porDia]);

    const tipos = ['doble', 'familiar', 'suite'];
    const coloresTipos = [
        { main: '#7a0202', bg: 'rgba(122,2,2,0.1)' },
        { main: '#02357a', bg: 'rgba(2,53,122,0.1)' },
        { main: '#027a2f', bg: 'rgba(2,122,64,0.1)' },
    ];

    const datosGrafico = {
        labels: categoriasDía,
        datasets: tipos.map((t, i) => ({
            label: t.toUpperCase(),
            data: porDia.map((d) => d.por_tipo?.[t]?.porcentaje ?? 0),
            fill: true,
            backgroundColor: coloresTipos[i].bg,
            borderColor: coloresTipos[i].main,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
        })),
    };

    const opcionesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: 'bold' }, color: '#9ca3af' },
            },
            y: {
                min: 0,
                max: 100,
                ticks: {
                    callback: (val) => `${val}%`,
                    font: { size: 10, weight: 'bold' },
                    color: '#9ca3af',
                },
                grid: { color: '#f3f4f6' },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#111827',
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    title: (context) =>
                        dayjs(porDia[context[0].dataIndex].fecha).format(
                            'DD [de] MMMM, YYYY',
                        ),
                    label: (ctx) => ` Ocupación: ${ctx.parsed.y}%`,
                },
            },
        },
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            {/* --- 1. ENCABEZADO PREMIUM (ESTILO REEMBOLSOS) --- */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                        Estadísticas y{' '}
                        <span className="text-[#7a0202]">Análisis</span>
                    </h1>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Panel de métricas y rendimiento operativo
                    </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                    <PresentationChartLineIcon className="h-6 w-6 text-gray-400" />
                </div>
            </div>

            {/* --- 2. BUSCADOR INTEGRADO (ESTILO CLIENTES) --- */}
            <div className="flex flex-col items-end gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all md:flex-row">
                <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="ml-2 text-[10px] font-black uppercase text-gray-400">
                            Fecha Inicio
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) =>
                                    onFechaChange?.('desde', e.target.value)
                                }
                                className="w-full rounded-xl border-none bg-gray-50 py-3 pl-10 text-sm font-bold text-gray-700 transition focus:ring-2 focus:ring-[#7a0202]/10"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="ml-2 text-[10px] font-black uppercase text-gray-400">
                            Fecha Fin
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) =>
                                    onFechaChange?.('hasta', e.target.value)
                                }
                                className="w-full rounded-xl border-none bg-gray-50 py-3 pl-10 text-sm font-bold text-gray-700 transition focus:ring-2 focus:ring-[#7a0202]/10"
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={onBuscar}
                    className="h-[46px] w-full rounded-xl bg-[#7a0202] px-10 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-100 transition hover:bg-[#5a0101] md:w-auto"
                >
                    Generar Reporte
                </button>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            {cargando ? (
                <div className="py-20 text-center">
                    <LoadingSpinner />
                    <span className="mt-4 block text-[10px] font-black uppercase tracking-widest text-gray-300">
                        Consultando métricas...
                    </span>
                </div>
            ) : !datos ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <InboxIcon className="mx-auto mb-4 h-12 w-12 text-gray-200" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                        Sin datos seleccionados
                    </h3>
                    <p className="mx-auto mt-1 max-w-xs text-xs italic text-gray-400">
                        Define un rango de fechas en la barra superior para
                        procesar las estadísticas.
                    </p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="transition-hover rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-200">
                                    <HomeIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase leading-none tracking-widest text-gray-400">
                                        Inventario
                                    </span>
                                    <div className="mt-1 text-3xl font-black leading-tight text-gray-900">
                                        {habitacionesTotales}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7a0202] text-white shadow-lg shadow-red-100">
                                    <ArrowTrendingUpIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase leading-none tracking-widest text-gray-400">
                                        Ocupación Media
                                    </span>
                                    <div className="mt-1 text-3xl font-black leading-tight text-[#7a0202]">
                                        {ocupacionMedia}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4 text-gray-400">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
                                    <ChartBarIcon className="h-6 w-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <span className="text-[10px] font-black uppercase leading-none tracking-widest">
                                        Análisis
                                    </span>
                                    <div className="mt-2 truncate text-[13px] font-black uppercase tracking-tighter text-gray-900">
                                        {fDesdeCargada} — {fHastaCargada}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfica con Eje X simplificado */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">
                                    Curva de Ocupación Diaria
                                </h3>
                                <div className="mt-2 inline-flex items-center rounded border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    Mes:{' '}
                                    <span className="ml-1 text-gray-900">
                                        {mesesLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                {tipos.map((t, i) => (
                                    <div
                                        key={t}
                                        className="flex items-center gap-2.5"
                                    >
                                        <span
                                            className="h-3 w-3 rounded-full shadow-sm"
                                            style={{
                                                backgroundColor:
                                                    coloresTipos[i].main,
                                            }}
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            {t}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            {mostrarGrafico ? (
                                <Line
                                    data={datosGrafico}
                                    options={opcionesGrafico}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">
                                    Gráfico pendiente de carga
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Registro Detallado */}
                    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                        <button
                            onClick={() =>
                                setMostrarDetallesTabla(!mostrarDetallesTabla)
                            }
                            className="flex w-full items-center justify-between bg-gray-50/50 px-8 py-5 transition-colors hover:bg-gray-50"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
                                Registro Detallado por Fecha
                            </span>
                            {mostrarDetallesTabla ? (
                                <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                            ) : (
                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                            )}
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${mostrarDetallesTabla ? 'max-h-[5000px]' : 'max-h-0'}`}
                        >
                            <div className="overflow-x-auto p-4 md:p-8">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                Día
                                            </th>
                                            {tipos.map((t, i) => (
                                                <th
                                                    key={t}
                                                    className="px-4 pb-4 text-center text-[10px] font-black uppercase tracking-[0.2em]"
                                                    style={{
                                                        color: coloresTipos[i]
                                                            .main,
                                                    }}
                                                >
                                                    {t}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {porDia.map((d) => (
                                            <tr
                                                key={d.fecha}
                                                className="group transition-colors hover:bg-gray-50/50"
                                            >
                                                <td className="px-4 py-4 font-mono text-xs font-bold text-gray-500 transition-colors group-hover:text-gray-900">
                                                    {dayjs(d.fecha).format(
                                                        'DD MMM',
                                                    )}
                                                </td>
                                                {tipos.map((t, i) => {
                                                    const pct =
                                                        d.por_tipo?.[t]
                                                            ?.porcentaje ?? 0;
                                                    return (
                                                        <td
                                                            key={t}
                                                            className="px-4 py-4 text-center"
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <div className="mb-1 text-xs font-black text-gray-900">
                                                                    {pct}%
                                                                </div>
                                                                <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-100">
                                                                    <div
                                                                        className="h-full"
                                                                        style={{
                                                                            width: `${pct}%`,
                                                                            backgroundColor:
                                                                                coloresTipos[
                                                                                    i
                                                                                ]
                                                                                    .main,
                                                                        }}
                                                                    />
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
