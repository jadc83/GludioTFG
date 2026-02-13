import { Line } from 'react-chartjs-2';
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
import { useMemo } from 'react';

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

export default function OccupationChart({ porDia = [], mostrarGrafico = false }) {
    const tipos = ['doble', 'familiar', 'suite'];
    const coloresTipos = [
        { main: '#7a0202', bg: 'rgba(122,2,2,0.1)' },
        { main: '#02357a', bg: 'rgba(2,53,122,0.1)' },
        { main: '#027a2f', bg: 'rgba(2,122,64,0.1)' },
    ];

    const categoriasDia = useMemo(() => porDia.map((d) => dayjs(d.fecha).format('D')), [porDia]);

    const datosGrafico = useMemo(() => ({
        labels: categoriasDia,
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
    }), [porDia, categoriasDia]);

    const opcionesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' }, color: '#9ca3af' } },
            y: {
                min: 0,
                max: 100,
                ticks: { callback: (val) => `${val}%`, font: { size: 10, weight: 'bold' }, color: '#9ca3af' },
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
                    title: (context) => dayjs(porDia[context[0].dataIndex].fecha).format('DD [de] MMMM, YYYY'),
                    label: (ctx) => ` Ocupación: ${ctx.parsed.y}%`,
                },
            },
        },
    };

    return (
        <div className="h-80 w-full">
            {mostrarGrafico ? (
                <Line data={datosGrafico} options={opcionesGrafico} />
            ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">
                    Gráfico pendiente de carga
                </div>
            )}
        </div>
    );
}
