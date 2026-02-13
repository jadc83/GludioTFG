import * as api from '@/api/estadisticas';
import IndexEstadisticas from '@/Components/indexes/IndexEstadisticas';
import { useEffect, useState } from 'react';

export default function TabEstadisticas({ reservas = [] }) {
    const [cargando, setCargando] = useState(false);
    const [datos, setDatos] = useState(null);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [mostrarGrafico, setMostrarGrafico] = useState(false);
    const [finanzas, setFinanzas] = useState({ ingresos: 0, reembolsos: 0, neto: 0 });

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        setFechaDesde(today);
        setFechaHasta(today);
        obtenerDatos(today, today, false);
    }, []);

    useEffect(() => {
        try {
            const desde = fechaDesde ? new Date(fechaDesde) : null;
            const hasta = fechaHasta ? new Date(fechaHasta) : null;

            let ingresos = 0;
            let reembolsos = 0;

            reservas.forEach((r) => {
                const reservaCreated = r.created_at ? new Date(r.created_at) : null;
                const inRangeReserva = (!desde || (reservaCreated && reservaCreated >= desde)) && (!hasta || (reservaCreated && reservaCreated <= new Date(hasta.getTime() + 24*60*60*1000 - 1)));
                if (inRangeReserva && r.reembolsos_total) {
                    reembolsos += parseFloat(r.reembolsos_total) || 0;
                }

                if (Array.isArray(r.pagos)) {
                    r.pagos.forEach((p) => {
                        const pagoDate = p.created_at ? new Date(p.created_at) : null;
                        const inRangePago = (!desde || (pagoDate && pagoDate >= desde)) && (!hasta || (pagoDate && pagoDate <= new Date(hasta.getTime() + 24*60*60*1000 - 1)));
                        if (inRangePago && (p.estado === 'completado' || p.estado === 'paid' || p.estado === 'completado')) {
                            ingresos += parseFloat(p.monto) || 0;
                        }
                    });
                }
            });

            const neto = ingresos - reembolsos;
            setFinanzas({ ingresos: Number(ingresos.toFixed(2)), reembolsos: Number(reembolsos.toFixed(2)), neto: Number(neto.toFixed(2)) });
        } catch (e) {
            setFinanzas({ ingresos: 0, reembolsos: 0, neto: 0 });
        }
    }, [reservas, fechaDesde, fechaHasta]);

    const obtenerDatos = async (desde, hasta, activarGrafico = true) => {
        setCargando(true);
        try {
            const res = await api.obtenerOcupacion({
                fecha_desde: desde,
                fecha_hasta: hasta,
            });
            if (res?.success) {
                setDatos(res.data);
                if (activarGrafico) setMostrarGrafico(true);
            } else {
                setDatos(null);
                setMostrarGrafico(false);
            }
        } catch (e) {
            console.error('Error obteniendo estadísticas', e);
            setDatos(null);
            setMostrarGrafico(false);
        } finally {
            // Delay mínimo para que el spinner sea bien perceptible
            setTimeout(() => setCargando(false), 3000);
        }
    };

    const handleBuscar = () => {
        if (!fechaDesde) return alert('Selecciona al menos una fecha');
        const hasta = fechaHasta || fechaDesde;
        obtenerDatos(fechaDesde, hasta);
    };

    const handleFechaChange = (tipo, valor) => {
        if (tipo === 'desde') setFechaDesde(valor);
        if (tipo === 'hasta') setFechaHasta(valor);
    };

    return (
        <div className="p-3 md:p-6">
            <IndexEstadisticas
                cargando={cargando}
                datos={datos}
                mostrarGrafico={mostrarGrafico}
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                onFechaChange={handleFechaChange}
                onBuscar={handleBuscar}
                finanzas={finanzas}
            />
        </div>
    );
}
