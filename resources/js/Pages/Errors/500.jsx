import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';

export default function Error500({ message = 'Error interno del servidor' }) {
    return (
        <AuthenticatedLayout>
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-6xl font-black text-red-700">500</h1>
                <p className="mt-4 text-xl font-bold text-gray-900">Error interno</p>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-8">
                    <Link
                        href={route('home')}
                        className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 font-bold text-white hover:bg-yellow-700"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
