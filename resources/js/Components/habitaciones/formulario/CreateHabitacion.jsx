import '@/../css/createHabitacion.css';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import Campo from '@/Components/formulario/Campo';
import { useHabitacionForm } from '@/hooks/useHabitacionForm';
import { limpiarFormulario } from '@/hooks/useFormHelpers';
import { TIPOS_HABITACION } from '@/utils/constantes';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CreateHabitacion({ iconOnly = false }) {

    const [abierto, setAbierto] = useState(false);

        const { formulario, cambiar, errores, estaCargando, capacidadFija, fotos, previsualizaciones, agregarFotos, quitarFoto, enviar, reset, clearErrors, MAX_FOTOS
            } = useHabitacionForm(null, () => { setAbierto(false); limpiarFormulario(reset, clearErrors); });

        const handleCerrar = () => { setAbierto(false); limpiarFormulario(reset, clearErrors); };

    return (
        <>
            <PrimaryButton onClick={() => setAbierto(true)} title="Nueva Habitación" aria-label="Nueva Habitación">
                <HomeIcon className="h-5 w-5" />
                {!iconOnly && ' Nueva Habitación'}
            </PrimaryButton>

            <dialog className={`modalDrawer ${abierto ? 'abierto' : ''}`}>
                <div className={`panelDrawer ${abierto ? 'abierto' : 'cerrado'}`}>
                    <header className="encabezadoDrawer">
                        <h3 className="tituloDrawer">Alta de Habitación</h3>
                        <button onClick={handleCerrar} className="btnCerrar">✕</button>
                    </header>

                    <form onSubmit={enviar} className="formularioHabitacion">
                        <div className="rejillaFormulario">
                            <Campo id="numero" label="Número" type="text" value={formulario.numero} onChange={cambiar} error={errores.numero}
                                placeholder="Ej: 101" claseExtra="font-mono" required
                                sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="mensajeError" clase="entradaTexto" />

                            <Campo id="tipo" label="Tipo" as="select" value={formulario.tipo} onChange={cambiar} error={errores.tipo}
                                sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="mensajeError" clase="selector">
                                {Object.entries(TIPOS_HABITACION).map(([clave, valor]) => (
                                    <option key={clave} value={valor}>
                                        {valor.charAt(0).toUpperCase() + valor.slice(1)}
                                    </option>
                                ))}
                            </Campo>



                            {capacidadFija ? (
                                <input type="hidden" id="capacidad" name="capacidad" value={formulario.capacidad} readOnly />
                            ) : (
                                <Campo id="capacidad" label="Capacidad" type="number" min="1" value={formulario.capacidad} onChange={cambiar}
                                    error={errores.capacidad} readOnly={capacidadFija} claseExtra={capacidadFija ? 'soloLectura font-mono' : 'font-mono'}
                                    sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="mensajeError" clase="entradaTexto" />
                            )}
                        </div>

                        <Campo id="estado" label="Estado" as="select" value={formulario.estado} onChange={cambiar} error={errores.estado}
                            sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="mensajeError" clase="selector">
                            <option value="disponible">Disponible</option>
                            <option value="ocupada">Ocupada</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="limpieza">Limpieza</option>
                        </Campo>

                        <InputFotos fotos={fotos} previews={previsualizaciones} onAgregar={agregarFotos} onQuitar={quitarFoto} error={errores.fotos}
                            maxFotos={MAX_FOTOS}/>

                        <Campo id="descripcion" label="Descripción" as="textarea" value={formulario.descripcion} onChange={cambiar} error={errores.descripcion}
                            placeholder="Detalles públicos..." sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="mensajeError" clase="areaTexto" />

                        <Campo id="notas" label="Notas Privadas" as="textarea" rows={3} value={formulario.notas} onChange={cambiar} error={errores.notas}
                            placeholder="Uso interno..." sinEstilosPorDefecto={true} claseContenedor="contenedorCampo" claseEtiqueta="etiquetaCampo" claseError="mensajeError" clase="areaTexto" />

                        <PrimaryButton type="submit" className="mt-4 w-full">
                            {estaCargando ? 'Guardando...' : 'Crear Habitación'}
                        </PrimaryButton>
                    </form>
                </div>
            </dialog>
        </>
    );
}

// Usamos el componente compartido `Campo` (importado arriba)

const InputFotos = ({ fotos = [], previews = [], onAgregar, onQuitar, error, maxFotos }) => (
    <div className="contenedorCampo">
        <label className="etiquetaCampo">
            <span className="textoEtiquetaCampo">
                Fotos ({fotos.length}/{maxFotos})
            </span>
        </label>
        <div className="rejillaFotos">
            {previews.map((src, indice) => (
                <div key={indice} className="vistaPreviaFoto">
                    <img src={src} alt={`Foto ${indice + 1}`} />
                    <button type="button" onClick={() => onQuitar(indice)} className="btnQuitarFoto">✕</button>
                </div>
            ))}
            {fotos.length < maxFotos && (
                <label className="zonaAgregarFoto">
                    <input type="file" accept="image/*" multiple hidden onChange={onAgregar} />
                    <span className="iconoAgregarFoto">+</span>
                    <span className="textoAgregarFoto">Añadir</span>
                </label>
            )}
        </div>
        {error && (
            <span className="mensajeError">
                {Array.isArray(error) ? error[0] : error}
            </span>
        )}
    </div>
);
