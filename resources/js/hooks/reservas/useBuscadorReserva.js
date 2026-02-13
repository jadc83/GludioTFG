import { useState } from 'react';
import service from './service';

export default function useBuscadorReserva() {
    const [localizador, setLocalizador] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [reserva, setReserva] = useState(null);
    const [error, setError] = useState('');

    const handleBuscar = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!localizador.trim()) {
            setError('Por favor ingresa un localizador');
            return;
        }

        setBuscando(true);
        setError('');
        setReserva(null);

        try {
            const r = await service.buscarReserva(localizador.trim());
            if (!r) {
                setError('No se encontró la reserva');
                setReserva(null);
            } else {
                setReserva(r);
            }
        } catch (err) {
            setError('Error al buscar la reserva');
            setReserva(null);
        } finally {
            setBuscando(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pendiente: 'badge-warning',
            confirmada: 'badge-info',
            completada: 'badge-success',
            cancelada: 'badge-error',
        };
        return colors[status] || 'badge-gray';
    };

    const getPagoBadge = (reservaObj) => {
        const reembolsos = reservaObj.reembolsos_total || 0;
        if (
            reembolsos > 0 &&
            reservaObj.precio_total &&
            reembolsos < reservaObj.precio_total
        )
            return 'badge-warning';
        const colors = {
            pendiente: 'badge-warning',
            pagado: 'badge-success',
            fallido: 'badge-error',
        };
        return colors[reservaObj.pago] || 'badge-gray';
    };

    return {
        localizador,
        setLocalizador,
        buscando,
        reserva,
        error,
        handleBuscar,
        getStatusBadge,
        getPagoBadge,
    };
}
