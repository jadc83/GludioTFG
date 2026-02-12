import { useCallback, useEffect, useState } from 'react';
import perfilService from '../services/perfilService';

export default function usePerfilDashboard(puedeVerTareas) {
    const [proximos, setProximos] = useState([]);
    const [completadas, setCompletadas] = useState([]);
    const [conteoActivas, setConteoActivas] = useState(0);
    const [cargando, setCargando] = useState(true);

    const capitalizar = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    const formatearFechaConMesCapitalizado = (input) => {
        const date = input instanceof Date ? input : new Date(input);
        try {
            const parts = new Intl.DateTimeFormat('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            }).formatToParts(date);
            return parts
                .map((p) => (p.type === 'month' ? capitalizar(p.value) : p.value))
                .join('');
        } catch (e) {
            const s = date.toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
            return s.replace(/\b([a-záéíóúñ])/, (m) => m.toUpperCase());
        }
    };

    const obtenerResumen = useCallback(async () => {
        if (!puedeVerTareas) {
            setCargando(false);
            setProximos([]);
            setCompletadas([]);
            setConteoActivas(0);
            return;
        }

        setCargando(true);
        try {
            const tData = await perfilService.obtenerTurnos();
            const ahora = new Date();

            const normalize = (s) => {
                if (!s) return null;
                let d = new Date(s);
                if (!isNaN(d)) return d;
                try {
                    d = new Date(s.replace(' ', 'T'));
                    if (!isNaN(d)) return d;
                    d = new Date(s.replace(' ', 'T') + 'Z');
                    if (!isNaN(d)) return d;
                } catch (e) {}
                return null;
            };

            const semanaInicio = (() => {
                const d = new Date(ahora);
                const day = d.getDay();
                const diff = (day + 6) % 7;
                d.setDate(d.getDate() - diff);
                d.setHours(0, 0, 0, 0);
                return d;
            })();
            const semanaFin = new Date(semanaInicio);
            semanaFin.setDate(semanaInicio.getDate() + 7);

            const enriched = (tData.turnos || []).map((t) => ({
                ...t,
                parsedStart: normalize(t.start),
                parsedEnd: normalize(t.end),
            }));

            const inWeek = enriched
                .filter((t) => {
                    const s = t.parsedStart || null;
                    const e = t.parsedEnd || t.parsedStart || null;
                    if (!s || !e) return false;
                    return s < semanaFin && e >= semanaInicio;
                })
                .sort((a, b) => (a.parsedStart ? a.parsedStart.getTime() : 0) - (b.parsedStart ? b.parsedStart.getTime() : 0));

            let turnos = [];
            if (inWeek.length > 0) turnos = inWeek;
            else
                turnos = enriched
                    .filter((t) => (t.parsedEnd && t.parsedEnd >= ahora) || (t.parsedStart && t.parsedStart >= ahora))
                    .sort((a, b) => (a.parsedStart ? a.parsedStart.getTime() : new Date(a.start).getTime()) - (b.parsedStart ? b.parsedStart.getTime() : new Date(b.start).getTime()));

            const agruparPorDia = (arr) => {
                const map = {};
                (arr || []).forEach((t) => {
                    const d = t.parsedStart || t.parsedEnd || (t.start ? new Date(t.start) : null);
                    if (!d) return;
                    const key = d.toISOString().slice(0, 10);
                    if (!map[key]) map[key] = { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items: [] };
                    map[key].items.push(t);
                });
                const days = Object.values(map).sort((a, b) => a.date - b.date);
                days.forEach((day) => day.items.sort((a, b) => (a.parsedStart ? a.parsedStart.getTime() : 0) - (b.parsedStart ? b.parsedStart.getTime() : 0)));
                return days;
            };

            setProximos(agruparPorDia(turnos));

            const cData = await perfilService.obtenerTareasCompletadas();
            const datosCompletadas = (cData.tareas || []).slice(0, 5);

            const aData = await perfilService.obtenerTareas();
            const activas = Array.isArray(aData.tareas) ? aData.tareas.length : 0;

            setCompletadas(datosCompletadas);
            setConteoActivas(activas);
        } catch (e) {
            console.error('usePerfilDashboard error', e);
            setProximos([]);
            setCompletadas([]);
            setConteoActivas(0);
        } finally {
            setCargando(false);
        }
    }, [puedeVerTareas]);

    useEffect(() => {
        obtenerResumen();
        const handler = () => obtenerResumen();
        window.addEventListener('tareas:updated', handler);
        return () => window.removeEventListener('tareas:updated', handler);
    }, [obtenerResumen]);

    const eliminarTurno = useCallback(async (id) => {
        try {
            await perfilService.eliminarTurno(id);
            obtenerResumen();
            window.dispatchEvent(new Event('tareas:updated'));
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Turno eliminado', type: 'success' } }));
        } catch (e) {
            console.error('eliminarTurno falló', e);
            throw e;
        }
    }, [obtenerResumen]);

    return {
        proximos,
        completadas,
        conteoActivas,
        cargando,
        refrescar: obtenerResumen,
        formatearFechaConMesCapitalizado,
        capitalizar,
        eliminarTurno,
    };
}
