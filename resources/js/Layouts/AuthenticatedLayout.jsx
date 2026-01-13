import Footer from '@/Components/Footer';
import CookieBanner from '@/Components/CookieBanner';
import BarraReservas from '@/Components/reservas/BarraReservas';
import Nav from '@/Components/Nav';
import { usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user;
    const { component } = usePage();

    // Ocultar BarraReservas en el dashboard
    const showBarraReservas = !component.startsWith('Dashboard');

    return (
        <div className="flex min-h-screen flex-col bg-gris">
            <Nav user={user} />

            {showBarraReservas && <BarraReservas />}

            <main className="flex flex-grow flex-col pt-16">{children}</main>

            <Footer />

            <CookieBanner />
        </div>
    );
}
