import InputFotos from './CreateHabitacionInputFotos';
import Campo from '@/Components/reservas/utilidades/Campo';

export default function CreateHabitacionMultimedia({ fotosNuevas, previsualizaciones, agregarFotos, quitarFoto, errores, MAX_FOTOS, formulario, cambiar }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <InputFotos fotos={fotosNuevas} previews={previsualizaciones} onAgregar={agregarFotos} onQuitar={quitarFoto} error={errores.fotos} maxFotos={MAX_FOTOS} />

            <Campo id="descripcion" label="Descripción Pública" as="textarea" rows={4} value={formulario.descripcion} onChange={cambiar} placeholder="Detalles atractivos para la web..." />
        </div>
    );
}
