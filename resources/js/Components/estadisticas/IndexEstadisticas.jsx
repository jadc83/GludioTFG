import React, { Suspense, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const OcupacionChart = React.lazy(() => import('./OcupacionChart'));

export default function IndexEstadisticas({ cargando = false, datos = null, mostrarGrafico = false }) {
    if (cargando) return <div>Cargando…</div>;

    if (!datos) return <div className="p-6 text-center text-sm text-gray-500">No hay datos. Usa el buscador para generar estadísticas.</div>;

    const { total_habitaciones: habitacionesTotales, total_por_tipo: totalPorTipo = {}, promedio_porcentaje_ocupacion: ocupacionMedia, promedio_porcentaje_ocupacion_por_tipo: promedioPorTipo = {}, por_dia: porDia, fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = datos;

    const categorias = porDia.map(d => d.fecha);

    const tipos = ['doble', 'familiar', 'suite'];

    const datosGrafico = {
        labels: categorias,
        datasets: tipos.map((t, i) => {
            const palette = [
                { bg: 'rgba(122,2,2,0.18)', border: '#7a0202' },
                { bg: 'rgba(2,53,122,0.18)', border: '#02357a' },
                { bg: 'rgba(2,122,64,0.18)', border: '#027a2f' }
            ][i];

            return {
                label: t.charAt(0).toUpperCase() + t.slice(1),
                data: porDia.map(d => d.por_tipo?.[t]?.porcentaje ?? 0),
                fill: true,
                backgroundColor: palette.bg,
                borderColor: palette.border,
                tension: 0.4,
                pointRadius: 3,
            };
        })
    };

    const opciones = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { ticks: { maxRotation: 0, minRotation: 0 } },
            y: { min: 0, max: 100, ticks: { callback: val => `${val}%` } }
        },
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}%` } }
        }
    };

    const [mostrarDetallesTabla, setMostrarDetallesTabla] = useState(false);

    return (
        <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="p-4 border-b">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="text-sm text-gray-500">Habitaciones totales</div>
                        <div className="text-2xl font-bold">{habitacionesTotales}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Periodo</div>
                        <div className="text-lg">{fechaDesde}{fechaDesde !== fechaHasta ? ` — ${fechaHasta}` : ''}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Ocupación media</div>
                        <div className="text-2xl font-bold">{ocupacionMedia}%</div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-b">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['doble','familiar','suite'].map((t, i) => {
                        const display = t.charAt(0).toUpperCase() + t.slice(1);
                        const colors = [
                            { bg: '#7a0202', light: '#fef2f2' },
                            { bg: '#02357a', light: '#eef6ff' },
                            { bg: '#027a2f', light: '#eef9ef' }
                        ][i];

                        return (
                            <div key={t} className="flex items-center gap-3 p-3 border rounded">
                                <div style={{ width: 36, height: 36, background: colors.bg, borderRadius: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }} />
                                <div className="text-left">
                                    <div className="text-sm text-gray-500">{display}</div>
                                    <div className="text-lg font-bold">{totalPorTipo?.[t] ?? 0} <span className="text-xs text-gray-500">({promedioPorTipo?.[t] ?? 0}%)</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-4">
                <div className="mb-4">
                    {mostrarGrafico ? (
                        <Suspense fallback={<div className="h-60 flex items-center justify-center">Cargando gráfico…</div>}>
                            <OcupacionChart porDia={porDia} />
                        </Suspense>
                    ) : (
                        <div className="h-48 md:h-60 flex items-center justify-center text-sm text-gray-500">Pulsa "Buscar" para ver el gráfico</div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto p-2 md:p-4">
                <div className="flex justify-end mb-2">
                    {!mostrarDetallesTabla ? (
                        <button onClick={() => setMostrarDetallesTabla(true)} aria-expanded={mostrarDetallesTabla} className="btn btn-sm btn-primary w-full sm:w-auto">Abrir detalles</button>
                    ) : (
                        <button onClick={() => setMostrarDetallesTabla(false)} aria-expanded={mostrarDetallesTabla} className="btn btn-sm btn-ghost w-full sm:w-auto">Cerrar detalles</button>
                    )}
                </div>

                <div className={`transition-all duration-300 ${mostrarDetallesTabla ? 'max-h-[2000px] overflow-auto' : 'max-h-0 overflow-hidden'}`}>
                    <div className="pb-2">
                        {/* Mobile: cards per date */}
                        <div className="grid gap-3 sm:hidden">
                            {porDia.map((d) => (
                                <div key={d.fecha} className="p-3 border rounded bg-white shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-mono text-sm">{d.fecha}</div>
                                        <div className="text-sm text-gray-600">Total: <span className="font-semibold">{d.ocupadas}</span></div>
                                    </div>

                                    {['doble','familiar','suite'].map((t, idx) => {
                                        const colors = ['#7a0202','#02357a','#027a2f'];
                                        const pct = d.por_tipo?.[t]?.porcentaje ?? 0;
                                        return (
                                            <div key={t} className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div style={{ width: 12, height: 12, background: colors[idx], borderRadius: 3 }} />
                                                        <div className="text-sm">{t.charAt(0).toUpperCase() + t.slice(1)}</div>
                                                    </div>
                                                    <div className="text-sm text-gray-500"><span className="font-semibold">{d.por_tipo?.[t]?.ocupadas ?? 0}</span> · {pct}%</div>
                                                </div>
                                                <div className="w-full bg-gray-100 h-2 rounded overflow-hidden mt-2">
                                                    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[idx]}, ${colors[idx]}66)` }} className="h-2 rounded" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden sm:block">
                            <table className="table table-zebra table-compact w-full text-xs md:text-sm panel-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th className="text-center">Doble <div className="text-xs text-gray-400">Ocupadas · %</div></th>
                                        <th className="text-center">Familiar <div className="text-xs text-gray-400">Ocupadas · %</div></th>
                                        <th className="text-center">Suite <div className="text-xs text-gray-400">Ocupadas · %</div></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {porDia.map((d) => (
                                        <tr key={d.fecha}>
                                            <td className="font-mono">{d.fecha}</td>
                                            {['doble','familiar','suite'].map((t, idx) => {
                                                const colors = ['#7a0202','#02357a','#027a2f'];
                                                const pct = d.por_tipo?.[t]?.porcentaje ?? 0;
                                                return (
                                                    <td key={t} className="align-top">
                                                        <div className="text-sm"><span className="font-semibold">Ocupadas</span>: {d.por_tipo?.[t]?.ocupadas ?? 0}</div>
                                                        <div className="text-xs text-gray-500"><span className="font-semibold">Porcentaje</span>: {pct}%</div>
                                                        <div className="w-full bg-gray-100 h-3 rounded overflow-hidden mt-1">
                                                            <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[idx]}, ${colors[idx]}66)` }} className="h-3 rounded" />
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
            </div>
        </div>
    );
}
