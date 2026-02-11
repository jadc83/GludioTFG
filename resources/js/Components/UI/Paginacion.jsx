import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Componente de paginación reutilizable con diseño industrial
 *
 * @param {Object} props
 * @param {number} props.paginaActual - Página actual (1-indexed)
 * @param {number} props.totalPaginas - Total de páginas
 * @param {number} props.inicio - Índice del primer elemento mostrado
 * @param {number} props.fin - Índice del último elemento mostrado
 * @param {number} props.total - Total de elementos
 * @param {Function} props.onCambiarPagina - Callback al cambiar de página
 * @param {string} [props.etiqueta='Registros'] - Etiqueta para los elementos (Registros, Clientes, etc.)
 */
export default function Paginacion({
    paginaActual,
    totalPaginas,
    inicio,
    fin,
    total,
    onCambiarPagina,
    etiqueta = 'Registros',
}) {
    const irAPaginaAnterior = () => {
        if (paginaActual > 1) {
            onCambiarPagina(paginaActual - 1);
        }
    };

    const irAPaginaSiguiente = () => {
        if (paginaActual < totalPaginas) {
            onCambiarPagina(paginaActual + 1);
        }
    };

    return (
        <nav
            role="navigation"
            aria-label="Paginación"
            className="flex flex-col items-center justify-between gap-6 border-t border-gray-100 bg-gray-50/50 px-8 py-6 sm:flex-row"
        >
            {/* Información de registros */}
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                Mostrando <span className="text-gray-900">{inicio + 1}</span> —{' '}
                <span className="text-gray-900">{Math.min(fin, total)}</span>{' '}
                <span className="mx-2 text-gray-200">|</span> Total{' '}
                <span className="text-gray-900">{total}</span> {etiqueta}
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center gap-4">
                {/* Botón anterior */}
                <button
                    onClick={irAPaginaAnterior}
                    disabled={paginaActual === 1}
                    aria-label="Página anterior"
                    aria-disabled={paginaActual === 1 ? 'true' : undefined}
                    className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition hover:text-[#7a0202] disabled:opacity-30"
                >
                    <ChevronLeftIcon
                        className="h-5 w-5 text-gray-600"
                        aria-hidden="true"
                    />
                </button>

                {/* Botones de página */}
                <ul role="list" className="flex gap-1.5">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                        (pagina) => (
                            <li key={pagina} role="listitem">
                                <button
                                    onClick={() => onCambiarPagina(pagina)}
                                    aria-current={
                                        paginaActual === pagina
                                            ? 'page'
                                            : undefined
                                    }
                                    aria-label={
                                        paginaActual === pagina
                                            ? `Página ${pagina}, página actual`
                                            : `Ir a la página ${pagina}`
                                    }
                                    className={`h-10 w-10 rounded-xl text-xs font-black transition-all ${
                                        paginaActual === pagina
                                            ? 'scale-110 bg-[#7a0202] text-white shadow-lg shadow-red-100'
                                            : 'border border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    {pagina}
                                </button>
                            </li>
                        ),
                    )}
                </ul>

                {/* Botón siguiente */}
                <button
                    onClick={irAPaginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                    aria-disabled={
                        paginaActual === totalPaginas ? 'true' : undefined
                    }
                    aria-label="Página siguiente"
                    className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition hover:text-[#7a0202] disabled:opacity-30"
                >
                    <ChevronRightIcon
                        className="h-5 w-5 text-gray-600"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </nav>
    );
}
