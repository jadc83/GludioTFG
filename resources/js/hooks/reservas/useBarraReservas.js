import { useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import useCalendarioPrecios from '../calendario/useCalendarioPrecios';
import useCalendarioDia from '../calendario/useCalendarioDia';
import useReservaForm from '../reservas/useReservaForm';

export default function useBarraReservas() {
    const formularioReserva = useReservaForm();
    const pagina = usePage();
    const esPanelControl =
        pagina.url?.includes('panel') || pagina.component === 'PanelControl';

    const [calendarioAbierto, setCalendarioAbierto] = useState(null);
    const calendarioRef = useRef(null);

    const { preciosPorDia, consultaPrecios, formatearISO, esMobile } =
        useCalendarioPrecios();

    // Cerrar calendario al hacer click fuera
    useEffect(() => {
        if (!calendarioAbierto) return;

        const handleClickOutside = (event) => {
            if (
                calendarioRef.current &&
                !calendarioRef.current.contains(event.target)
            ) {
                setCalendarioAbierto(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [calendarioAbierto]);

    useEffect(() => {
        const handler = (event) => setCalendarioAbierto(event.detail);
        window.addEventListener('abrirCalendario', handler);
        return () => window.removeEventListener('abrirCalendario', handler);
    }, []);

    // Cargar precios cuando se abre el calendario
    useEffect(() => {
        if (!calendarioAbierto) return;
        const inicio = new Date();
        const fin = new Date();
        fin.setDate(fin.getDate() + 365);
        const start = formatearISO(inicio);
        const end = formatearISO(fin);
        consultaPrecios(start, end);
    }, [calendarioAbierto, consultaPrecios, formatearISO]);

    const mapaPrecios = useMemo(() => preciosPorDia || {}, [preciosPorDia]);
    const componentesDia = useCalendarioDia(mapaPrecios, formatearISO);

    return {
        formularioReserva,
        esPanelControl,
        calendarioAbierto,
        setCalendarioAbierto,
        calendarioRef,
        preciosPorDia,
        componentesDia,
        esMobile,
        formatearISO,
    };
}
