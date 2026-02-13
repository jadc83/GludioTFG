import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ShowDepartamentoHeader({ detalleDepartamento, departamento, encargado, onCerrar }) {
    return (
        <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    {detalleDepartamento?.name || departamento?.name || 'Departamento'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {detalleDepartamento?.descripcion || detalleDepartamento?.description || 'Descripción no disponible.'}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Encargado: {encargado ? encargado.name : '—'}
                </p>
            </div>
            <button onClick={onCerrar} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </header>
    );
}
