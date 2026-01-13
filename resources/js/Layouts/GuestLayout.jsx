import Footer from '@/Components/Footer';
import CookieBanner from '@/Components/CookieBanner';
import BarraReservas from '@/Components/reservas/BarraReservas';
import Navbar from '@/Components/Nav';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            <Navbar />

            <BarraReservas />

            <main className="flex flex-grow flex-col pt-16">{children}</main>

            <Footer />

            <CookieBanner />
        </div>
    );
}
