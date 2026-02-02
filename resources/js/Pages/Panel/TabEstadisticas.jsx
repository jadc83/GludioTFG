import * as api from '@/api/estadisticas';
import IndexEstadisticas from '@/Components/estadisticas/IndexEstadisticas';
import { useEffect, useState } from 'react';

export default function TabEstadisticas() {
    const [cargando, setCargando] = useState(false);
    const [datos, setDatos] = useState(null);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [mostrarGrafico, setMostrarGrafico] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        setFechaDesde(today);
        setFechaHasta(today);
        obtenerDatos(today, today, false);
    }, []);

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
            />
        </div>
    );
}
