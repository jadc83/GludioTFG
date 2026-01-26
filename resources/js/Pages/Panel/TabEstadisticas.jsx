import { useEffect, useState } from 'react';
import * as api from '@/api/estadisticas';
import IndexEstadisticas from '@/Components/estadisticas/IndexEstadisticas';

export default function TabEstadisticas() {
    const [cargando, setCargando] = useState(false);
    const [datos, setDatos] = useState(null);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const [mostrarGrafico, setMostrarGrafico] = useState(false);

    useEffect(() => {
        // establecer hoy por defecto pero NO mostrar el gráfico hasta que el usuario haga Buscar
        const today = new Date().toISOString().slice(0,10);
        setFechaDesde(today);
        setFechaHasta(today);
        // obtener datos iniciales, pero no activar el gráfico (activarGrafico = false)
        obtenerDatos(today, today, false);
    }, []);

    const obtenerDatos = async (desde, hasta, activarGrafico = true) => {
        setCargando(true);
        try {
            const res = await api.obtenerOcupacion({ date_from: desde, date_to: hasta });
            console.debug('estadisticas.obtenerDatos', { desde, hasta, res });
            if (res?.success) {
                setDatos(res.data);
                // activar el gráfico sólo si se solicitó así (por ejemplo desde el botón Buscar)
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
            setCargando(false);
        }
    };

    const buscar = (e) => {
        e.preventDefault();
        if (!fechaDesde) return alert('Selecciona al menos una fecha');
        const hasta = fechaHasta || fechaDesde;
        console.debug('estadisticas.buscar', { fechaDesde, fechaHasta: hasta });
        // la petición activará el gráfico cuando devuelva datos correctos (activarGrafico por defecto = true)
        obtenerDatos(fechaDesde, hasta);
    };

    return (
        <div className="p-3 md:p-6">
            <h2 className="panel-heading">Estadísticas</h2>

            <form onSubmit={buscar} className="mb-4 flex flex-col sm:flex-row gap-2 items-end">
                <div>
                    <label className="label">
                        <span className="label-text text-sm">Fecha desde</span>
                    </label>
                    <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input input-bordered" />
                </div>
                <div>
                    <label className="label">
                        <span className="label-text text-sm">Fecha hasta (opcional)</span>
                    </label>
                    <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input input-bordered" />
                </div>
                <div>
                    <button type="submit" className="btn btn-primary btn-sm btn-index btn-primary-burgundy">Buscar</button>
                </div>
            </form>

            <IndexEstadisticas cargando={cargando} datos={datos} mostrarGrafico={mostrarGrafico} />
        </div>
    );
}
