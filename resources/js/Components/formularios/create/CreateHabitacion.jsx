import Boton from '@/Components/UI/Boton';
import { HomeIcon } from '@heroicons/react/24/outline';
import useCreateHabitacion from '@/hooks/useCreateHabitacion';
import CreateHabitacionHeader from './CreateHabitacionHeader';
import CreateHabitacionTabs from './CreateHabitacionTabs';
import CreateHabitacionInfo from './CreateHabitacionInfo';
import CreateHabitacionMultimedia from './CreateHabitacionMultimedia';
import CreateHabitacionAdmin from './CreateHabitacionAdmin';
import CreateHabitacionFooter from './CreateHabitacionFooter';

export default function CreateHabitacion({ iconOnly = false }) {
    const {
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
        fotosNuevas,
        previsualizaciones,
        agregarFotos,
        quitarFoto,
        MAX_FOTOS,
        getTabClass,
    } = useCreateHabitacion();

    return (
        <>
            <Boton onClick={abrir} icon={HomeIcon} size={iconOnly ? 'sm' : 'md'} className={iconOnly ? '!px-3 !py-3' : ''}>
                {!iconOnly && 'Nueva Habitación'}
            </Boton>

            <div className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-300 md:top-16 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
                <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`} role="button" tabIndex={0} onClick={cerrar} onKeyDown={(e) => { if (e.key === 'Escape') cerrar(); }} />

                <div className={`absolute inset-0 flex w-full max-w-full transform flex-col bg-white shadow-2xl transition-transform duration-500 md:bottom-0 md:left-auto md:right-0 md:top-0 md:max-w-md ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden rounded-none md:!rounded-l-[2rem]`}>
                    <CreateHabitacionHeader onCerrar={cerrar} />
                    <CreateHabitacionTabs tabActiva={tabActiva} setTabActiva={setTabActiva} getTabClass={getTabClass} />

                    <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col bg-white">
                        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-8">
                            {tabActiva === 'info' && (
                                <CreateHabitacionInfo formulario={formulario} cambiar={cambiar} errores={errores} />
                            )}

                            {tabActiva === 'multimedia' && (
                                <CreateHabitacionMultimedia fotosNuevas={fotosNuevas} previsualizaciones={previsualizaciones} agregarFotos={agregarFotos} quitarFoto={quitarFoto} errores={errores} MAX_FOTOS={MAX_FOTOS} formulario={formulario} cambiar={cambiar} />
                            )}

                            {tabActiva === 'admin' && (
                                <CreateHabitacionAdmin formulario={formulario} cambiar={cambiar} errores={errores} />
                            )}
                        </div>

                        <CreateHabitacionFooter estaCargando={estaCargando} />
                    </form>
                </div>
            </div>
        </>
    );
}


