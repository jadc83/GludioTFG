import Footer from '@/Components/Footer';
import MenuLateral from '@/Components/MenuLateral';
import Navbar from '@/Components/Nav';

export default function GuestLayout({ children }) {
    return (
        <div className="w-full bg-gray-100">
            <Navbar />

            <MenuLateral />

            <main className="w-full pt-16">
                {children}
            </main>

            <Footer />
        </div>
    );
}
