import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-gray-100 bg-gris">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-sm text-black sm:px-6 lg:px-8">
                <p>
                    &copy; {new Date().getFullYear()} HOTEL GLUDIO. Todos los derechos reservados.
                </p>
                <nav className="space-x-4">
                    <Link href="#" className="hover:underline">
                        Politica de privacidad
                    </Link>
                    <Link href="#" className="hover:underline">
                        Terminos del servicio
                    </Link>
                    <Link href="#" className="hover:underline">
                        Contacto
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
