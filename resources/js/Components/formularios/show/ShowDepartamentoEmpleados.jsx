export default function ShowDepartamentoEmpleados({ title, empleados = [], onVerPerfil }) {
    return (
        <div>
            <h4 className="text-sm font-black uppercase text-gray-700">{title}</h4>
            {empleados.length === 0 ? (
                <div className="text-sm text-gray-500">No hay {title.toLowerCase()} en este departamento.</div>
            ) : (
                <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
                    <table className="w-full text-left table-fixed">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] text-gray-400">
                                <th className="px-4 py-2 w-56">Nombre</th>
                                <th className="px-4 py-2 w-24 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empleados.map((e) => (
                                <tr key={e.id} className="border-t">
                                    <td className="px-4 py-2 font-semibold text-sm truncate w-56 whitespace-nowrap overflow-hidden" title={e.name}>{e.name}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => onVerPerfil(e)} className="rounded-lg bg-blue-600 px-3 py-1 text-white text-sm">Ver perfil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
