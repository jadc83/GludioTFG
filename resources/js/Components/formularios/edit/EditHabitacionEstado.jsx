import { CheckCircleIcon, CogIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function EditHabitacionEstado({ formulario, cambiar, errores }) {
    return (
        <div>
            <label className="campo-label" htmlFor="estado"><span className="campo-label-text">Estado</span></label>

            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => cambiar({ target: { name: 'estado', value: 'disponible' } })} className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'disponible' ? 'bg-success/10 border-success text-success' : 'hover:border-success/50 border-gray-200'}`}>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Disponible</span>
                </button>

                <button type="button" onClick={() => cambiar({ target: { name: 'estado', value: 'ocupada' } })} className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'ocupada' ? 'bg-error/10 border-error text-error' : 'hover:border-error/50 border-gray-200'}`}>
                    <LockClosedIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Ocupada</span>
                </button>

                <button type="button" onClick={() => cambiar({ target: { name: 'estado', value: 'mantenimiento' } })} className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'mantenimiento' ? 'bg-warning/10 border-warning text-warning' : 'hover:border-warning/50 border-gray-200'}`}>
                    <CogIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Mantenimiento</span>
                </button>

                <button type="button" onClick={() => cambiar({ target: { name: 'estado', value: 'limpieza' } })} className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'limpieza' ? 'bg-info/10 border-info text-info' : 'hover:border-info/50 border-gray-200'}`}>
                    <SparklesIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Limpieza</span>
                </button>
            </div>

            {(errores.estado) && (
                <span className="campo-error">{Array.isArray(errores.estado) ? errores.estado[0] : errores.estado}</span>
            )}
        </div>
    );
}
