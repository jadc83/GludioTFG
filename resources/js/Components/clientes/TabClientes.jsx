import IndexCliente from "./IndexCliente";

export default function TabClientes({ clientes = [], users = [] }) {
    return (
        <div className="p-6">
        <IndexCliente clientes={clientes} users={users} />
        </div>
    );
}
