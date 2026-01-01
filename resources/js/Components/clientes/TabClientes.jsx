import IndexCliente from './IndexCliente';

export default function TabClientes({
    clientes = [],
    users = [],
    estadisticas = {},
    clientesFiltrados = [],
}) {
    return (
        <div className="p-6">
            <IndexCliente
                clientes={clientes}
                users={users}
                estadisticas={estadisticas}
                clientesFiltrados={clientesFiltrados}
            />
        </div>
    );
}
