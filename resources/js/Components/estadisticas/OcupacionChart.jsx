import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale,  PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function OcupacionChart({ porDia }) {
    React.useEffect(() => {
        console.debug('OcupacionChart montado, porDia.length=', porDia?.length ?? 0);
    }, [porDia]);

    if (!porDia || porDia.length === 0) {
        return <div className="h-60 flex items-center justify-center text-sm text-gray-500">No hay datos para el gráfico en el rango seleccionado.</div>;
    }

    const categorias = porDia.map(d => d.date);

    const datosGrafico = {
        labels: categorias,
        datasets: [
            {
                label: 'Ocupación %',
                data: porDia.map(d => d.occupancy_percent),
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
        <div className="mb-4 h-60">
            <Line data={datosGrafico} options={opciones} />
        </div>
    );
}
