import { UserIcon } from '@heroicons/react/24/outline';

export default function TarjetaEncargado({ encargado }) {
    if (!encargado) return null;

    return (
        <div className="mt-4 mb-4 rounded-xl bg-white p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-bold">
                {encargado.name ? encargado.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div className="text-sm">
                <div className="font-medium text-gray-900">{encargado.name}</div>
                <div className="text-gray-500">{encargado.email || '—'} <span className="mx-2">·</span> {encargado.telefono || '—'}</div>
            </div>
        </div>
    );
}
