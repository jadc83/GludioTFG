import Footer from '@/Components/Footer';
import MenuLateral from '@/Components/MenuLateral';
import Navbar from '@/Components/Nav';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            <Navbar />

            <MenuLateral />

            <main className="flex flex-grow flex-col pt-16">{children}</main>

            <Footer />
        </div>
    );
}
