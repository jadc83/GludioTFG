export default function ClienteItem({ cliente, onSeleccionar }) {
    return (
        <li role="option">
            <button
                type="button"
                onClick={() => onSeleccionar(cliente)}
                className="block w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
                <div className="font-medium text-gray-900">{cliente.name}</div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{cliente.email}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
                        {cliente.tipo_usuario === 'user' ? 'Usuario registrado' : 'Cliente'}
                    </span>
                </div>
                {cliente.numero_documento && (
                    <div className="text-xs text-gray-400">
                        {cliente.tipo_documento?.toUpperCase()}: {cliente.numero_documento}
                    </div>
                )}
            </button>
        </li>
    );
}
