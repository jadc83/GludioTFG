import Footer from '@/Components/Footer';
import MenuLateral from '@/Components/MenuLateral';
import Nav from '@/Components/Nav';
import { usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user;

    return (
        <div className="flex min-h-screen flex-col bg-gris">
            <Nav user={user} />

            <MenuLateral />

            <main className="flex flex-grow flex-col pt-16">
                {children}
            </main>

            <Footer />
        </div>
    );
}
