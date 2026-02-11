import IndexCliente from '../indexes/IndexCliente';

export default function TabClientes({
    clientes = [],
    users = [],
    estadisticas = {},
    clientesFiltrados = [],
}) {
    return (
        <div className="p-3 md:p-6">
            <section aria-label="Pestaña clientes">
                <IndexCliente
                    clientes={clientes}
                    users={users}
                    estadisticas={estadisticas}
                    clientesFiltrados={clientesFiltrados}
                />
            </section>
        </div>
    );
}
