import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function BusquedaClientesForm({ busqueda, setBusqueda, mostrarResultadosSetter, limpiar }) {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>

            <input
                id="busqueda-clientes"
                type="text"
                value={busqueda}
                onChange={(e) => {
                    setBusqueda(e.target.value);
                    mostrarResultadosSetter(true);
                }}
                onFocus={() => mostrarResultadosSetter(true)}
                placeholder="Buscar por nombre, email o documento..."
                aria-label="Campo búsqueda clientes"
                className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 text-sm shadow-sm transition-colors focus:border-[#7a0202] focus:outline-none focus:ring-2 focus:ring-[#7a0202]/20"
            />

            {busqueda && (
                <button
                    type="button"
                    onClick={limpiar}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
