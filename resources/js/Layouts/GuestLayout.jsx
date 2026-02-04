import BarraReservas from '@/Components/reservas/BarraReservas';
import CookieBanner from '@/Components/UI/CookieBanner';
import Footer from '@/Components/UI/Footer';
import Navbar from '@/Components/UI/Nav';
import Toast from '@/Components/UI/Toast';
import { emitToast } from '@/utils/toast';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function GuestLayout({ children }) {
    const page = usePage();
    useEffect(() => {
        const errors = page?.props?.errors || {};
        if (errors && Object.keys(errors).length > 0) {
            const first = Object.keys(errors)[0];
            let msg = null;
            try {
                const val = errors[first];
                if (Array.isArray(val)) {
                    msg = val[0];
                } else if (val && typeof val === 'object') {
                    msg = JSON.stringify(val);
                } else if (val !== undefined && val !== null) {
                    msg = String(val);
                }
            } catch (e) {
                msg = null;
            }

            if (msg) emitToast(msg, 'error');
        }

        // Debug: mostrar flash en consola en desarrollo para investigar casos raros (p.ej. toast con "D")
        if (import.meta.env.DEV && page?.props?.flash) {
            console.debug('DEBUG: page.props.flash =>', page.props.flash);
        }

        // Mostrar notificación si el backend puso refund_info en flash
        const refund = page?.props?.flash?.refund_info;
        if (refund && refund.amount) {
            const amt = Number(refund.amount || 0).toFixed(2);
            emitToast(`Se ha solicitado un reembolso parcial de ${amt}€`, 'success');
        }

        // Mostrar flash.success como toast (si existe)
        const successMsg = page?.props?.flash?.success;
        if (successMsg) {
            const safeMsg = typeof successMsg === 'string' ? successMsg : JSON.stringify(successMsg);
            if (typeof safeMsg === 'string' && safeMsg.length === 1) {
                console.warn('Ignored suspicious short flash.success:', page.props.flash);
            } else {
                emitToast(safeMsg, 'success');
            }
        }
    }, [page.props.errors, page.props.flash]);

    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            <Navbar />

            <BarraReservas />

            <main className="flex flex-grow flex-col pt-16">{children}</main>

            <Footer />

            <CookieBanner />

            <Toast />
        </div>
    );
}
