import Campo from '@/Components/reservas/utilidades/Campo';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Componente de barra de búsqueda y filtros reutilizable
 *
 * @param {Object} props
 * @param {Object} props.filtros - Objeto con los valores actuales de los filtros
 * @param {Function} props.onActualizarFiltro - Función para actualizar un filtro específico
 * @param {Function} props.onLimpiarFiltros - Función para resetear todos los filtros
 * @param {string} props.placeholderBusqueda - Texto placeholder del campo de búsqueda
 * @param {Array} [props.filtrosAdicionales] - Array de configuraciones de filtros adicionales
 * @param {string} [props.layout='row'] - Layout: 'row' o 'grid'
 *
 */
export default function BarraBuscador({
    filtros,
    onActualizarFiltro,
    onLimpiarFiltros,
    placeholderBusqueda = 'Buscar...',
    filtrosAdicionales = [],
    layout = 'row',
}) {
    const esGrid = layout === 'grid';

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div
                className={
                    esGrid
                        ? 'flex flex-col gap-3 xl:flex-row xl:items-start xl:gap-4'
                        : 'flex flex-col gap-4 md:flex-row md:items-center'
                }
            >
                {/* Contenedor de campos */}
                <form
                    onSubmit={(e) => e.preventDefault()}
                    role="search"
                    aria-label="Buscar"
                    className="w-full"
                >
                    <div
                        className={
                            esGrid
                                ? 'grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:flex-1'
                                : 'flex w-full flex-col gap-4 md:flex-row md:items-center'
                        }
                    >
                        {/* Campo de búsqueda principal */}
                        <div
                            className={`relative ${esGrid ? '' : 'w-full md:flex-1'}`}
                        >
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full rounded-xl border-none bg-gray-50 py-3 pl-12 text-sm font-medium transition focus:ring-2 focus:ring-[#7a0202]/10"
                                placeholder={placeholderBusqueda}
                                value={filtros.busqueda || ''}
                                onChange={(e) =>
                                    onActualizarFiltro(
                                        'busqueda',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>

                        {/* Filtros adicionales */}
                        {filtrosAdicionales.map((filtro, index) => {
                            if (filtro.tipo === 'select') {
                                return (
                                    <Campo
                                        key={index}
                                        as="select"
                                        id={`filtro-${filtro.nombre}`}
                                        aria-label={
                                            filtro.ariaLabel ||
                                            filtro.etiqueta ||
                                            filtro.nombre
                                        }
                                        clase={`w-full rounded-xl border-none bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition focus:ring-2 focus:ring-[#7a0202]/10 ${!esGrid ? 'md:flex-1' : ''}`}
                                        value={
                                            filtros[filtro.nombre] || 'todos'
                                        }
                                        onChange={(e) =>
                                            onActualizarFiltro(
                                                filtro.nombre,
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {filtro.opciones.map(
                                            (opcion, optIndex) => (
                                                <option
                                                    key={optIndex}
                                                    value={opcion.valor}
                                                >
                                                    {opcion.etiqueta}
                                                </option>
                                            ),
                                        )}
                                    </Campo>
                                );
                            }

                            if (filtro.tipo === 'input') {
                                return (
                                    <div
                                        key={index}
                                        className={`relative ${!esGrid ? 'w-full md:flex-1' : ''}`}
                                    >
                                        {filtro.icono && (
                                            <div className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
                                                {filtro.icono}
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            className={`w-full rounded-xl border-none bg-gray-50 py-3 text-sm font-medium transition focus:ring-2 focus:ring-[#7a0202]/10 ${
                                                filtro.icono ? 'pl-10' : 'pl-4'
                                            }`}
                                            placeholder={
                                                filtro.placeholder || ''
                                            }
                                            value={filtros[filtro.nombre] || ''}
                                            onChange={(e) =>
                                                onActualizarFiltro(
                                                    filtro.nombre,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                </form>

                {/* Botón limpiar filtros */}
                <button
                    onClick={onLimpiarFiltros}
                    className={`rounded-xl bg-gray-100 px-6 py-1.5 text-xs font-bold uppercase text-gray-500 transition hover:bg-gray-200 ${esGrid ? 'w-full xl:w-auto' : ''}`}
                    title="Limpiar filtros"
                >
                    Limpiar
                </button>
            </div>
        </div>
    );
}
