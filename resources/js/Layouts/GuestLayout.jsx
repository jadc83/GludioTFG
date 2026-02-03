import BarraReservas from '@/Components/reservas/BarraReservas';
import CookieBanner from '@/Components/UI/CookieBanner';
import Footer from '@/Components/UI/Footer';
import Navbar from '@/Components/UI/Nav';
import Toast from '@/Components/UI/Toast';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function GuestLayout({ children }) {
    const page = usePage();
    useEffect(() => {
        const errors = page?.props?.errors || {};
        if (errors && Object.keys(errors).length > 0) {
            const first = Object.keys(errors)[0];
            const msg = errors[first] && errors[first][0];
            if (msg) window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'error' } }));
        }

        // Mostrar notificación si el backend puso refund_info en flash
        const refund = page?.props?.flash?.refund_info;
        if (refund && refund.amount) {
            const amt = Number(refund.amount || 0).toFixed(2);
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Se ha solicitado un reembolso parcial de ${amt}€`, type: 'success' } }));
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
