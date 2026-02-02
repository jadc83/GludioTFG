import { InboxIcon } from '@heroicons/react/24/outline';

export default function HeaderPanel({
    titulo,
    subtitulo,
    icono: Icono = InboxIcon,
    children,
}) {
    return (
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                    Gestión de <span className="text-[#7a0202]">{titulo}</span>
                </h1>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                    {subtitulo}
                </p>
            </div>
            <div className="flex items-center gap-4">
                {children}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
                    <Icono className="h-6 w-6 text-gray-400" />
                </div>
            </div>
        </div>
    );
}
