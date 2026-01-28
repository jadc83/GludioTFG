import Campo from '@/Components/formulario/Campo';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import { useEmpleadoForm } from '@/hooks/useEmpleadoForm';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function EditEmpleado({ empleado, abierto, onCerrar }) {
    const { formulario, cambiar, errores, estaCargando, enviar, limpiar } = useEmpleadoForm(empleado, onCerrar);

    const handleCerrar = () => {
        onCerrar?.();
        limpiar();
    };

    return (
        <div className={`fixed inset-x-0 top-16 bottom-0 z-[9999] transition-all duration-300 ${abierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleCerrar}
            />

            <div className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-in-out transform ${abierto ? 'translate-x-0' : 'translate-x-full'} !rounded-l-[2rem] overflow-hidden`}>
                <header className="flex-none p-6 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            {empleado ? `Editar Empleado: ${empleado.name}` : 'Editar Empleado'}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión de Personal</p>
                    </div>
                    <button onClick={handleCerrar} className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#7a0202] rounded-2xl transition-all border border-gray-100 shadow-sm">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </header>

                {empleado && (
                    <form onSubmit={enviar} className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <Campo id="name" label="Nombre Completo" value={formulario.name || ''} onChange={cambiar} error={errores.name} required />

                            <Campo id="email" label="Email" type="email" value={formulario.email || ''} onChange={cambiar} error={errores.email} required />

                            <div className="grid grid-cols-2 gap-4">
                                <Campo id="tipo_documento" label="Tipo Doc." as="select" value={formulario.tipo_documento || ''} onChange={cambiar}>
                                    {Object.entries(TIPOS_DOCUMENTO).map(([clave, valor]) => (
                                        <option key={clave} value={valor}>{valor.toUpperCase()}</option>
                                    ))}
                                </Campo>
                                <Campo id="numero_documento" label="Documento" value={formulario.numero_documento || ''} onChange={cambiar} error={errores.numero_documento} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Campo id="numero_empleado" label="Número de empleado" value={formulario.numero_empleado || ''} onChange={cambiar} error={errores.numero_empleado} required />
                                <Campo id="departamento" label="Departamento" value={formulario.departamento || ''} onChange={cambiar} error={errores.departamento} />
                            </div>

                            <Campo id="puesto" label="Puesto" value={formulario.puesto || ''} onChange={cambiar} error={errores.puesto} />

                            <div className="grid grid-cols-2 gap-4">
                                <Campo id="telefono" label="Teléfono" value={formulario.telefono || ''} onChange={cambiar} error={errores.telefono} />
                                <Campo id="nacionalidad" label="Nacionalidad" value={formulario.nacionalidad || ''} onChange={cambiar} error={errores.nacionalidad} />
                            </div>

                            <Campo id="direccion" label="Dirección" as="textarea" rows={2} value={formulario.direccion || ''} onChange={cambiar} error={errores.direccion} />
                        </div>

                        <div className="flex-none p-6 bg-gray-50 border-t border-gray-100">
                            <button type="submit" disabled={estaCargando} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#7a0202] transition-all shadow-xl disabled:opacity-50">
                                {estaCargando ? 'Actualizando...' : 'Actualizar Empleado'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
