import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ReservaBreadcrumbs({
    activeIndex = 0,
    separator = 'slash',
    className = '',
    textClass = '',
    align = 'left'
}) {
    const labels = ['Fechas', 'Habitación', 'Datos', 'Confirmar'];

    const containerClasses = `flex items-center gap-1 sm:gap-2 ${align === 'center' ? 'justify-center mx-auto' : ''} ${className}`;

    return (
        <nav aria-label="Progreso" className={containerClasses}>
            {labels.map((etiqueta, i) => {
                const colorClass = i === activeIndex
                    ? 'sm:text-[#7a0202] text-white'
                    : i < activeIndex
                        ? 'sm:text-gray-900 text-white opacity-90'
                        : 'sm:text-gray-400 text-white opacity-70';

                return (
                    <div key={i} className="flex shrink-0 items-center gap-1">
                        <span
                            className={`${textClass} text-[10px] sm:text-sm font-black uppercase tracking-[0.08em] sm:tracking-[0.15em] ${colorClass}`}
                        >
                            {etiqueta}
                        </span>

                        {i < labels.length - 1 &&
                            (separator === 'slash' ? (
                                <span className="text-gray-200 sm:text-gray-300">/</span>
                            ) : separator === 'chevron' ? (
                                <ChevronRightIcon className="h-3 w-3 text-gray-300" />
                            ) : separator === 'arrow' ? (
                                <span className="text-xs text-gray-300">›</span>
                            ) : (
                                <span className="text-xs text-gray-300">/</span>
                            ))}
                    </div>
                );
            })}
        </nav>
    );
}
