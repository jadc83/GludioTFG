import { XMarkIcon } from '@heroicons/react/24/outline';
import ShowDepartamentoHeader from './ShowDepartamentoHeader';
import ShowDepartamentoEmpleados from './ShowDepartamentoEmpleados';
import useShowDepartamento from '@/hooks/useShowDepartamento';

export default function ShowDepartamento({ departamento, abierto, onCerrar }) {
    const { detalleDepartamento, abrirPerfilEmpleado, encargado, operarios, auxiliares } = useShowDepartamento({ departamento, abierto });

    return (
        <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`} onClick={onCerrar} role="button" tabIndex={0} aria-label="Cerrar" onKeyDown={(e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); onCerrar(); } }} />

            <div className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}>
                <ShowDepartamentoHeader detalleDepartamento={detalleDepartamento} departamento={departamento} encargado={encargado} onCerrar={onCerrar} />

                <div className="flex-1 overflow-y-auto p-6">
                    {!detalleDepartamento ? (
                        <div className="p-6 text-sm text-gray-500">Cargando...</div>
                    ) : (
                        <div className="space-y-6">
                            <ShowDepartamentoEmpleados title="Operarios" empleados={operarios} onVerPerfil={abrirPerfilEmpleado} />
                            <ShowDepartamentoEmpleados title="Auxiliares" empleados={auxiliares} onVerPerfil={abrirPerfilEmpleado} />
                        </div>
                    )}
                </div>
            </div>

            {/* Navegación al perfil realiza la redirección; no renderizamos drawer aquí */}
        </div>
    );
}
