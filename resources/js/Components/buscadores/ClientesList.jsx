import ClienteItem from './ClienteItem';

export default function ClientesList({ filtrados, cargando, onSeleccionar }) {
    if (cargando) {
        return <div className="px-4 py-3 text-sm text-gray-500">Cargando clientes...</div>;
    }

    if (!filtrados || filtrados.length === 0) {
        return <div className="px-4 py-3 text-sm text-gray-500">No se encontraron clientes</div>;
    }

    return (
        <ul className="divide-y divide-gray-100">
            {filtrados.map((cliente) => (
                <ClienteItem key={`${cliente.tipo_usuario}-${cliente.id}`} cliente={cliente} onSeleccionar={onSeleccionar} />
            ))}
        </ul>
    );
}
