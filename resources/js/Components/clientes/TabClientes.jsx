import IndexCliente from "./IndexCliente";

export default function TabClientes({ clientes = [] }) {
    return (
        <div className="p-6">
            <IndexCliente clientes={clientes} />
        </div>
    );
}
