import Footer from '@/Components/UI/Footer';
import CookieBanner from '@/Components/UI/CookieBanner';
import BarraReservas from '@/Components/reservas/BarraReservas';
import Nav from '@/Components/UI/Nav';
import { usePage } from '@inertiajs/react';
import Toast from '@/Components/UI/Toast';
import { useEffect, useState } from 'react';

export default function AuthenticatedLayout({ children }) {
    const page = usePage();
    const user = page.props.auth.user;
    const { component } = page;

    // Ocultar BarraReservas en el dashboard
    const showBarraReservas = !component.startsWith('Dashboard');

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
        <div className="flex min-h-screen flex-col bg-gris">
            <Nav user={user} />

            {showBarraReservas && <BarraReservas />}

            <main className="flex flex-grow flex-col pt-16">{children}</main>

            <Footer />

            <CookieBanner />

            <Toast message={toastMsg} />
        </div>
    );
}
