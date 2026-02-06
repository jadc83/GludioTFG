import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ReservaBreadcrumbs({
    activeIndex = 0,
    separator = 'slash',
    className = '',
    textClass = '',
    align = 'left', // 'left' | 'center'
}) {
    const labels = ['Fechas', 'Habitación', 'Datos', 'Confirmar'];

    const containerClasses = `flex items-center gap-1 ${align === 'center' ? 'justify-center mx-auto' : ''} ${className}`;

    return (
        <nav aria-label="Progreso" className={containerClasses}>
            {labels.map((etiqueta, i) => (
                <div key={i} className="flex shrink-0 items-center gap-1">
                    <span
                        className={`${textClass} font-black uppercase tracking-[0.15em] ${
                            i === activeIndex
                                ? 'text-[#7a0202]'
                                : i < activeIndex
                                  ? 'text-gray-900'
                                  : 'text-gray-400'
                        }`}
                    >
                        {etiqueta}
                    </span>

                    {i < labels.length - 1 &&
                        (separator === 'slash' ? (
                            <span className="text-gray-200">/</span>
                        ) : separator === 'chevron' ? (
                            <ChevronRightIcon className="h-3 w-3 text-gray-300" />
                        ) : separator === 'arrow' ? (
                            <span className="text-xs text-gray-300">›</span>
                        ) : (
                            <span className="text-xs text-gray-300">/</span>
                        ))}
                </div>
            ))}
        </nav>
    );
}
