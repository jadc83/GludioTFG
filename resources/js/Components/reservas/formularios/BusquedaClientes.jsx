import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { obtenerClientes } from '@/hooks/reservas/service';

export default function BusquedaClientes({ onSeleccionar, clienteSeleccionado }) {
    const [busqueda, setBusqueda] = useState('');
    const [clientes, setClientes] = useState([]);
    const [filtrados, setFiltrados] = useState([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [cargando, setCargando] = useState(false);
    const contenedorRef = useRef(null);

    // Cargar todos los clientes al montar
    useEffect(() => {
        setCargando(true);
        obtenerClientes()
            .then((data) => {
                setClientes(data || []);
            })
            .finally(() => {
                setCargando(false);
            });
    }, []);

    // Filtrar clientes según búsqueda
    useEffect(() => {
        if (!busqueda.trim()) {
            setFiltrados([]);
            return;
        }

        const terminoBusqueda = busqueda.toLowerCase();
        const resultados = clientes.filter((cliente) => {
            const nombre = (cliente.name || '').toLowerCase();
            const email = (cliente.email || '').toLowerCase();
            const documento = (cliente.numero_documento || '').toLowerCase();

            return (
                nombre.includes(terminoBusqueda) ||
                email.includes(terminoBusqueda) ||
                documento.includes(terminoBusqueda)
            );
        });

        setFiltrados(resultados);
    }, [busqueda, clientes]);

    // Cerrar resultados al hacer clic fuera
    useEffect(() => {
        const handleClickFuera = (event) => {
            if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
                setMostrarResultados(false);
            }
        };

        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, []);

    const handleSeleccionar = (cliente) => {
        onSeleccionar(cliente);
        setBusqueda(`${cliente.name} - ${cliente.email}`);
        setMostrarResultados(false);
    };

    const handleLimpiar = () => {
        setBusqueda('');
        setFiltrados([]);
        onSeleccionar(null);
    };

    return (
        <div ref={contenedorRef} className="relative">
            <label className="mb-2 block text-sm font-medium text-gray-700">
                Buscar Cliente Existente
                <span className="ml-1 text-xs text-gray-500">(Opcional)</span>
            </label>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>

                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => {
                        setBusqueda(e.target.value);
                        setMostrarResultados(true);
                    }}
                    onFocus={() => setMostrarResultados(true)}
                    placeholder="Buscar por nombre, email o documento..."
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 text-sm shadow-sm transition-colors focus:border-[#7a0202] focus:outline-none focus:ring-2 focus:ring-[#7a0202]/20"
                />

                {busqueda && (
                    <button
                        type="button"
                        onClick={handleLimpiar}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Resultados de búsqueda */}
            {mostrarResultados && busqueda && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    {cargando ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            Cargando clientes...
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            No se encontraron clientes
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {filtrados.map((cliente) => (
                                <li key={`${cliente.tipo_usuario}-${cliente.id}`}>
                                    <button
                                        type="button"
                                        onClick={() => handleSeleccionar(cliente)}
                                        className="block w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
                                    >
                                        <div className="font-medium text-gray-900">
                                            {cliente.name}
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>{cliente.email}</span>
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
                                                {cliente.tipo_usuario === 'user'
                                                    ? 'Usuario registrado'
                                                    : 'Cliente'}
                                            </span>
                                        </div>
                                        {cliente.numero_documento && (
                                            <div className="text-xs text-gray-400">
                                                {cliente.tipo_documento?.toUpperCase()}: {cliente.numero_documento}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {clienteSeleccionado && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="text-sm font-medium text-green-900">
                                Cliente seleccionado
                            </div>
                            <div className="mt-1 text-sm text-green-700">
                                {clienteSeleccionado.name} - {clienteSeleccionado.email}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLimpiar}
                            className="text-green-600 hover:text-green-800"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
