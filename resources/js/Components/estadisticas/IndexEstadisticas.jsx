import React, { Suspense } from 'react';
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

    const { total_habitaciones: habitacionesTotales, por_dia: porDia, promedio_porcentaje_ocupacion: ocupacionMedia, fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = datos;

    const categorias = porDia.map(d => d.fecha);

    const datosGrafico = {
        labels: categorias,
        datasets: [
            {
                label: 'Ocupación %',
                data: porDia.map(d => d.porcentaje_ocupacion),
                fill: true,
                backgroundColor: 'rgba(122,2,2,0.18)',
                borderColor: '#7a0202',
                tension: 0.4,
                pointRadius: 3,
            }
        ]
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

    return (
        <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between gap-4">
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

            <div className="p-4">
                <div className="mb-4">
                    {mostrarGrafico ? (
                        <Suspense fallback={<div className="h-60 flex items-center justify-center">Cargando gráfico…</div>}>
                            <OcupacionChart porDia={porDia} />
                        </Suspense>
                    ) : (
                        <div className="h-60 flex items-center justify-center text-sm text-gray-500">Pulsa "Buscar" para ver el gráfico</div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto p-2 md:p-4">
                <table className="table table-zebra table-compact w-full text-xs md:text-sm panel-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Ocupadas</th>
                            <th>Ocupación</th>
                            <th>Gráfico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {porDia.map((d) => (
                            <tr key={d.fecha}>
                                <td className="font-mono">{d.fecha}</td>
                                <td>{d.ocupadas}</td>
                                <td>{d.porcentaje_ocupacion}%</td>
                                <td>
                                    <div className="w-full bg-gray-100 h-3 rounded overflow-hidden">
                                        <div style={{ width: `${d.porcentaje_ocupacion}%` }} className="h-3 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
