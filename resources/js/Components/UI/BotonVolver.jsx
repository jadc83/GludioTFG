import { router } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BotonVolver({ href = null, onClick = null, label = 'Volver' }) {
    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (href) {
            router.visit(href);
        } else {
            window.history.back();
        }
    };

    return (
        <button onClick={handleClick} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">
            <ArrowLeftIcon className="h-4 w-4" />
            {label}
        </button>
    );
}
