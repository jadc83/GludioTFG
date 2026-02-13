import CreateHabitacionInputFotos from '@/Components/formularios/create/CreateHabitacionInputFotos';
import Campo from '@/Components/reservas/utilidades/Campo';

export default function EditHabitacionMultimedia({ fotosNuevas, previsualizaciones, agregarFotos, quitarFoto, fotosGuardadas, errores, MAX_FOTOS, formulario, cambiar }) {
    return (
        <div>
            <CreateHabitacionInputFotos fotos={fotosNuevas} previews={previsualizaciones} fotosGuardadas={fotosGuardadas} onAgregar={agregarFotos} onQuitar={quitarFoto} error={errores.fotos} maxFotos={MAX_FOTOS} />

            <Campo id="descripcion" label="Descripción" as="textarea" value={formulario.descripcion} onChange={cambiar} placeholder="Detalles públicos..." error={errores.descripcion} sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="campo-label" claseError="campo-error" clase="campo-textarea" />
        </div>
    );
}
