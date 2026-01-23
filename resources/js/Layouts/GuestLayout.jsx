import Footer from '@/Components/Footer';
import CookieBanner from '@/Components/CookieBanner';
import BarraReservas from '@/Components/reservas/BarraReservas';
import Navbar from '@/Components/Nav';
import Toast from '@/Components/Toast';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function GuestLayout({ children }) {
    const page = usePage();
    const [toastMsg, setToastMsg] = useState(null);

    useEffect(() => {
        const errors = page?.props?.errors || {};
        if (errors && Object.keys(errors).length > 0) {
            const first = Object.keys(errors)[0];
            const msg = errors[first] && errors[first][0];
            if (msg) setToastMsg(msg);
        }
    }, [page.props.errors]);

    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            <Navbar />

            <BarraReservas />

            <main className="flex flex-grow flex-col pt-16">{children}</main>

            <Footer />

            <CookieBanner />

            <Toast message={toastMsg} />
        </div>
    );
}
