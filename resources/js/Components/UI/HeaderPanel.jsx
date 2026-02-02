import { InboxIcon } from '@heroicons/react/24/outline';

export default function HeaderPanel({
    titulo,
    subtitulo,
    icono: Icono = InboxIcon,
    children,
}) {
    return (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-gray-900 md:text-2xl">
                    Gestión de <span className="text-[#7a0202]">{titulo}</span>
                </h1>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 md:text-xs md:tracking-widest">
                    {subtitulo}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {children}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
                    <Icono className="h-6 w-6 text-gray-400" />
                </div>
            </div>
        </div>
    );
}
