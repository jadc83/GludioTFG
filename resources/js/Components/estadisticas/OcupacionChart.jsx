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
import React from 'react';
import { Line } from 'react-chartjs-2';

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

export default function OcupacionChart({ porDia }) {
    React.useEffect(() => {
        // debug logs removed
    }, [porDia]);

    if (!porDia || porDia.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500 md:h-60">
                No hay datos para el gráfico en el rango seleccionado.
            </div>
        );
    }

    const categorias = porDia.map((d) => d.fecha);

    const tipos = ['doble', 'familiar', 'suite'];
    const palette = [
        { bg: 'rgba(122,2,2,0.18)', border: '#7a0202' },
        { bg: 'rgba(2,53,122,0.18)', border: '#02357a' },
        { bg: 'rgba(2,122,64,0.18)', border: '#027a2f' },
    ];

    const datosGrafico = {
        labels: categorias,
        datasets: tipos.map((t, i) => ({
            label: t.charAt(0).toUpperCase() + t.slice(1),
            data: porDia.map((d) => d.por_tipo?.[t]?.porcentaje ?? 0),
            fill: false,
            backgroundColor: palette[i].bg,
            borderColor: palette[i].border,
            tension: 0.4,
            pointRadius: 3,
        })),
    };

    const opciones = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { ticks: { maxRotation: 0, minRotation: 0 } },
            y: { min: 0, max: 100, ticks: { callback: (val) => `${val}%` } },
        },
        plugins: {
            legend: { display: true },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
                },
            },
        },
    };

    return (
        <div className="mb-4 h-48 md:h-60">
            <Line data={datosGrafico} options={opciones} />
        </div>
    );
}
