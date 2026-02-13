import { EyeIcon, InboxIcon, PencilIcon, StarIcon } from '@heroicons/react/24/outline';

export default function ClientesTable({ clientes = [], abrirEdicion }) {
    return (
        <div className="overflow-x-auto">
            <table className="responsive-table w-full border-collapse text-left" role="table" aria-label="Tabla de clientes">
                <caption className="sr-only">Listado de clientes</caption>
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Nombre</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Email</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Documento</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Teléfono</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Dirección</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {clientes.map((cliente) => (
                        <tr key={`${cliente.tipo_usuario}-${cliente.id}`} className="group transition-colors hover:bg-gray-50/50">
                            <td className="px-6 py-4" data-label="Nombre">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-400">{cliente.name.charAt(0)}</div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">{cliente.name}</span>
                                        {cliente.tipo_usuario === 'usuario' && <StarIcon className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                                    </div>
                                </div>
                            </td>

                            <td className="px-6 py-4" data-label="Email"><span className="font-mono text-xs text-gray-400">{cliente.email}</span></td>

                            <td className="px-6 py-4" data-label="Documento">
                                {cliente.tipo_documento ? (
                                    <div className="flex flex-col">
                                        <span className="mb-1 text-[10px] font-bold uppercase leading-none text-[#7a0202]">{cliente.tipo_documento}</span>
                                        <span className="font-mono text-sm font-medium tracking-tighter text-gray-700">{cliente.numero_documento}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold uppercase text-gray-300">Sin Documento</span>
                                )}
                            </td>

                            <td className="px-6 py-4" data-label="Teléfono"><div className="text-sm font-bold text-gray-700">{cliente.telefono || '—'}</div></td>

                            <td className="px-6 py-4" data-label="Dirección"><div className="max-w-[150px] truncate text-[10px] font-bold uppercase text-gray-400">{cliente.direccion || 'No hay dirección'}</div></td>

                            <td className="px-6 py-4 text-right" data-label="Acciones">
                                <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><EyeIcon className="h-5 w-5" /></button>
                                    <button onClick={() => abrirEdicion(cliente)} className="rounded-lg bg-gray-50 p-2 text-gray-400 transition hover:bg-red-50 hover:text-[#7a0202]"><PencilIcon className="h-5 w-5" /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
