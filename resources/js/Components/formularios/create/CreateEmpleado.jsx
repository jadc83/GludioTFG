import Boton from '@/Components/UI/Boton';
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import useCreateEmpleado from '@/hooks/useCreateEmpleado';
import CreateEmpleadoHeader from './CreateEmpleadoHeader';
import CreateEmpleadoTabs from './CreateEmpleadoTabs';
import CreateEmpleadoPersonal from './CreateEmpleadoPersonal';
import CreateEmpleadoLaboral from './CreateEmpleadoLaboral';
import CreateEmpleadoContacto from './CreateEmpleadoContacto';
import CreateEmpleadoFooter from './CreateEmpleadoFooter';

export default function CreateEmpleado({ iconOnly = false }) {
    const {
        roles,
        departamentos,
        abierto,
        abrir,
        cerrar,
        tabActiva,
        setTabActiva,
        formulario,
        cambiar,
        errores,
        estaCargando,
        enviar,
        limpiar,
        getTabClass,
    } = useCreateEmpleado();

    return (
        <>
            <Boton onClick={abrir} icon={BriefcaseIcon} size={iconOnly ? 'sm' : 'md'} className={iconOnly ? '!px-3 !py-3' : ''} title="Nuevo Empleado" aria-label="Nuevo Empleado">
                {!iconOnly && 'Nuevo Empleado'}
            </Boton>

            <div className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-300 md:top-16 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
                <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`} role="button" tabIndex={0} onClick={cerrar} onKeyDown={(e) => { if (e.key === 'Escape') cerrar(); }} />

                <div className={`absolute inset-0 flex w-full max-w-full transform flex-col bg-white shadow-2xl transition-transform duration-500 md:bottom-0 md:left-auto md:right-0 md:top-0 md:max-w-md ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden rounded-none md:!rounded-l-[2rem]`}>
                    <CreateEmpleadoHeader onCerrar={cerrar} />
                    <CreateEmpleadoTabs tabActiva={tabActiva} setTabActiva={setTabActiva} getTabClass={getTabClass} />

                    <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col bg-white">
                        <div className="flex-1 space-y-8 overflow-y-auto p-8">
                            {tabActiva === 'personal' && (
                                <CreateEmpleadoPersonal formulario={formulario} cambiar={cambiar} errores={errores} />
                            )}

                            {tabActiva === 'laboral' && (
                                <CreateEmpleadoLaboral formulario={formulario} cambiar={cambiar} errores={errores} departamentos={departamentos} roles={roles} />
                            )}

                            {tabActiva === 'contacto' && (
                                <CreateEmpleadoContacto formulario={formulario} cambiar={cambiar} errores={errores} />
                            )}
                        </div>

                        <CreateEmpleadoFooter estaCargando={estaCargando} />
                    </form>
                </div>
            </div>
        </>
    );
}
