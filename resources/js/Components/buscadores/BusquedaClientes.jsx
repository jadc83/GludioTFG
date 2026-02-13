import useBusquedaClientes from '@/hooks/reservas/useBusquedaClientes';
import BusquedaClientesForm from './BusquedaClientesForm';
import ClientesList from './ClientesList';

export default function BusquedaClientes({ onSeleccionar, clienteSeleccionado }) {
    const {
        busqueda,
        setBusqueda,
        filtrados,
        mostrarResultados,
        setMostrarResultados,
        cargando,
        contenedorRef,
        seleccionarCliente,
        limpiar,
    } = useBusquedaClientes({ onSeleccionar, clienteSeleccionado });

    return (
        <div ref={contenedorRef} className="relative" role="search" aria-label="Buscar cliente">
            <label htmlFor="busqueda-clientes" className="mb-2 block text-sm font-medium text-gray-700">
                Buscar Cliente Existente
                <span className="ml-1 text-xs text-gray-500">(Opcional)</span>
            </label>

            <BusquedaClientesForm busqueda={busqueda} setBusqueda={setBusqueda} mostrarResultadosSetter={setMostrarResultados} limpiar={limpiar} />

            {mostrarResultados && busqueda && (
                <div role="listbox" aria-label="Resultados de búsqueda" className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    <ClientesList filtrados={filtrados} cargando={cargando} onSeleccionar={seleccionarCliente} />
                </div>
            )}

            {clienteSeleccionado && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="text-sm font-medium text-green-900">Cliente seleccionado</div>
                            <div className="mt-1 text-sm text-green-700">{clienteSeleccionado.name} - {clienteSeleccionado.email}</div>
                        </div>
                        <button type="button" onClick={limpiar} className="text-green-600 hover:text-green-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
