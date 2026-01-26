import { useEffect, useState } from 'react';
import * as api from '@/api/reservas';
import IndexReembolsos from '@/Components/reembolsos/IndexReembolsos';

export default function TabReembolsos() {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);

    const fetchData = async (p = page) => {
        setLoading(true);
        try {
            const res = await api.listarSolicitudesReembolso({ page: p });
            const paginator = res?.data ?? res ?? null;
            const rows = paginator?.data ?? (Array.isArray(paginator) ? paginator : []);
            setItems(rows);
            setPagination(paginator);
        } catch (e) {
            console.error('Error loading refunds', e);
            setItems([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(page); }, [page]);

    // Suscribirse a broadcasts para refrescar la tabla cuando una nueva solicitud llega
    useEffect(() => {
        try {
            if (window.Echo) {
                const channel = window.Echo.private('admin.refund-requests');
                channel.listen('RefundRequestCreated', () => fetchData(1));
            }
        } catch (e) {
            // no bloquear por falta de echo
            console.warn('Echo no disponible para reembolsos', e);
        }
    }, []);

    const aprobar = async (id) => {
        if (!confirm('Aprobar y ejecutar reembolso?')) return;
        try {
            const res = await api.aprobarSolicitud(id);
            if (res?.success) {
                alert('Reembolso ejecutado y solicitud aprobada');
                fetchData(page);
            } else {
                alert(res?.message || 'Error');
            }
        } catch (e) { alert('Error ejecutando reembolso'); }
    };

    const rechazar = async (id) => {
        const motivo = prompt('Motivo de rechazo (requerido)');
        if (!motivo) return alert('Motivo requerido');
        try {
            const res = await api.rechazarSolicitud(id, { admin_reason: motivo });
            if (res?.success) {
                alert('Solicitud rechazada');
                fetchData(page);
            } else {
                alert(res?.message || 'Error');
            }
        } catch (e) { alert('Error rechazando solicitud'); }
    };

    const borrar = async (id) => {
        if (!confirm('¿Borrar esta solicitud de reembolso? Esta acción marcará la solicitud como eliminada.')) return;
        try {
            const res = await api.eliminarSolicitud(id);
            if (res?.success) {
                alert('Solicitud eliminada.');
                fetchData(page);
            } else {
                alert(res?.message || 'Error borrando solicitud');
            }
        } catch (e) {
            alert('Error borrando solicitud');
        }
    };

    return (
        <IndexReembolsos
            refunds={items}
            pagination={pagination}
            loading={loading}
            onPageChange={(p) => setPage(p)}
            onApprove={aprobar}
            onReject={rechazar}
            onDelete={borrar}
        />
    );
}
