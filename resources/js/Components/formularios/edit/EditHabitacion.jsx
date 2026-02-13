import '@/../css/createHabitacion.css';
import { useState } from 'react';
import useEditHabitacion from '@/hooks/useEditHabitacion';
import EditHabitacionHeader from './EditHabitacionHeader';
import EditHabitacionInfo from './EditHabitacionInfo';
import EditHabitacionEstado from './EditHabitacionEstado';
import EditHabitacionMultimedia from './EditHabitacionMultimedia';
import EditHabitacionFooter from './EditHabitacionFooter';

export default function EditHabitacion({ habitacion, abierto, onCerrar }) {
    const [submitting, setSubmitting] = useState(false);

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        enviar,
        limpiar,
        MAX_FOTOS,
        fotosNuevas,
        fotosGuardadas,
        previsualizaciones,
        agregarFotos,
        quitarFoto,
    } = useEditHabitacion({ habitacion, onSuccess: () => { onCerrar?.(); } });

    const handleCerrar = () => {
        onCerrar?.();
        limpiar();
    };

    return (
        <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`} role="button" tabIndex={0} onClick={handleCerrar} onKeyDown={(e) => { if (e.key === 'Escape') handleCerrar(); }} />

            <div className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}>
                <EditHabitacionHeader title={habitacion ? `Cambio en Habitación ${habitacion.numero}` : 'Editar Habitación'} onCerrar={handleCerrar} />

                {habitacion && (
                    <form onSubmit={(e) => { setSubmitting(true); enviar(e).finally(() => setSubmitting(false)); }} className="flex min-h-0 flex-1 flex-col bg-white">
                        <div className="flex-1 space-y-8 overflow-y-auto p-8">
                            <EditHabitacionInfo formulario={formulario} cambiar={cambiar} errores={errores} />

                            <EditHabitacionEstado formulario={formulario} cambiar={cambiar} errores={errores} />

                            <EditHabitacionMultimedia fotosNuevas={fotosNuevas} previsualizaciones={previsualizaciones} agregarFotos={agregarFotos} quitarFoto={quitarFoto} fotosGuardadas={fotosGuardadas} errores={errores} MAX_FOTOS={MAX_FOTOS} formulario={formulario} cambiar={cambiar} />

                            {/* Notas internas */}
                            <div>
                                <label className="campo-label" htmlFor="notas"><span className="campo-label-text">Notas Privadas</span></label>
                                <textarea id="notas" name="notas" value={formulario.notas} onChange={cambiar} className="campo-textarea" placeholder="Solo uso interno..." />
                                {errores.notas && <span className="campo-error">{Array.isArray(errores.notas) ? errores.notas[0] : errores.notas}</span>}
                            </div>
                        </div>

                        <EditHabitacionFooter estaCargando={estaCargando} submitting={submitting} />
                    </form>
                )}
            </div>
        </div>
    );
}
