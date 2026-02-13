import Campo from '@/Components/reservas/utilidades/Campo';
import { TIPOS_HABITACION } from '@/utils/constantes';

export default function EditHabitacionInfo({ formulario, cambiar, errores, capacidadFija }) {
    return (
        <div className="form-grid">
            <Campo id="numero" label="Número" type="text" value={formulario.numero} onChange={cambiar} placeholder="Ej: 101" claseExtra="font-mono" required error={errores.numero} sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="campo-error" clase="entradaTexto" />

            <Campo id="tipo" label="Tipo" as="select" value={formulario.tipo} onChange={cambiar} error={errores.tipo} sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="campo-error" clase="selector">
                {Object.entries(TIPOS_HABITACION).map(([clave, valor]) => (
                    <option key={clave} value={valor}>{valor.charAt(0).toUpperCase() + valor.slice(1)}</option>
                ))}
            </Campo>

            {capacidadFija ? (
                <input type="hidden" id="capacidad" name="capacidad" value={formulario.capacidad} readOnly />
            ) : (
                <Campo id="capacidad" label="Capacidad" type="number" min="1" value={formulario.capacidad} onChange={cambiar} claseExtra={capacidadFija ? 'readonly font-mono' : 'font-mono'} readOnly={capacidadFija} required error={errores.capacidad} sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="campo-error" clase="entradaTexto" />
            )}
        </div>
    );
}
