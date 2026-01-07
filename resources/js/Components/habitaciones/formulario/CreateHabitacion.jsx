import '@/../css/createHabitacion.css';
import PrimaryButton from '@/Components/PrimaryButton';
import { useHabitacionForm } from '@/hooks/useHabitacionForm';
import { TIPOS_HABITACION } from '@/utils/constantes';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CreateHabitacion({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        capacidadFija,
        fotos,
        previsualizaciones,
        agregarFotos,
        quitarFoto,
        enviar,
        reset,
        MAX_FOTOS,
    } = useHabitacionForm(null, () => {
        setAbierto(false);
        reset();
    });

    const handleCerrar = () => {
        setAbierto(false);
        reset();
    };

    return (
        <>
            <PrimaryButton
                onClick={() => setAbierto(true)}
                title="Nueva Habitación"
                aria-label="Nueva Habitación"
            >
                <HomeIcon className="h-5 w-5" />
                {!iconOnly && ' Nueva Habitación'}
            </PrimaryButton>

            <dialog className={`modalDrawer ${abierto ? 'abierto' : ''}`}>
                <div
                    className={`panelDrawer ${abierto ? 'abierto' : 'cerrado'}`}
                >
                    <header className="encabezadoDrawer">
                        <h3 className="tituloDrawer">Alta de Habitación</h3>
                        <button onClick={handleCerrar} className="btnCerrar">
                            ✕
                        </button>
                    </header>

                    <form onSubmit={enviar} className="formularioHabitacion">
                        <div className="rejillaFormulario">
                            <Campo
                                id="numero"
                                label="Número"
                                type="text"
                                value={formulario.numero}
                                onChange={cambiar}
                                error={errores.numero}
                                required
                                placeholder="Ej: 101"
                                classNameExtra="font-mono"
                            />

                            <Campo
                                id="tipo"
                                label="Tipo"
                                as="select"
                                value={formulario.tipo}
                                onChange={cambiar}
                                error={errores.tipo}
                            >
                                {Object.entries(TIPOS_HABITACION).map(([clave, valor]) => (
                                    <option key={clave} value={valor}>
                                        {valor.charAt(0).toUpperCase() + valor.slice(1)}
                                    </option>
                                ))}
                            </Campo>

                            <Campo
                                id="precio_noche"
                                label="Precio €"
                                type="number"
                                step="0.01"
                                value={formulario.precio_noche}
                                onChange={cambiar}
                                error={errores.precio_noche}
                                required
                                classNameExtra="font-mono"
                            />

                            <Campo
                                id="capacidad"
                                label="Capacidad"
                                type="number"
                                min="1"
                                value={formulario.capacidad}
                                onChange={cambiar}
                                error={errores.capacidad}
                                readOnly={capacidadFija}
                                classNameExtra={
                                    capacidadFija
                                        ? 'soloLectura font-mono'
                                        : 'font-mono'
                                }
                            />
                        </div>

                        <Campo
                            id="estado"
                            label="Estado"
                            as="select"
                            value={formulario.estado}
                            onChange={cambiar}
                            error={errores.estado}
                        >
                            <option value="disponible">Disponible</option>
                            <option value="ocupada">Ocupada</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="limpieza">Limpieza</option>
                        </Campo>

                        <InputFotos
                            fotos={fotos}
                            previews={previsualizaciones}
                            onAgregar={agregarFotos}
                            onQuitar={quitarFoto}
                            error={errores.fotos}
                            maxFotos={MAX_FOTOS}
                        />

                        <Campo
                            id="descripcion"
                            label="Descripción"
                            as="textarea"
                            value={formulario.descripcion}
                            onChange={cambiar}
                            error={errores.descripcion}
                            placeholder="Detalles públicos..."
                        />

                        <Campo
                            id="notas"
                            label="Notas Privadas"
                            as="textarea"
                            rows={3}
                            value={formulario.notas}
                            onChange={cambiar}
                            error={errores.notas}
                            placeholder="Solo uso interno..."
                        />

                        <PrimaryButton type="submit" className="mt-4 w-full">
                            {estaCargando ? 'Guardando...' : 'Crear Habitación'}
                        </PrimaryButton>
                    </form>
                </div>
            </dialog>
        </>
    );
}

const Campo = ({
    id,
    label,
    as = 'input',
    error,
    classNameExtra = '',
    children,
    ...props
}) => {
    const InputTag = as;
    const claseBase =
        as === 'textarea'
            ? 'areaTexto'
            : as === 'select'
              ? 'selector'
              : 'entradaTexto';
    return (
        <div className="contenedorCampo">
            <label className="etiquetaCampo" htmlFor={id}>
                <span className="textoEtiquetaCampo">{label}</span>
            </label>
            <InputTag
                id={id}
                name={id}
                className={`${claseBase} ${error ? 'error' : ''} ${classNameExtra}`}
                {...props}
            >
                {children}
            </InputTag>
            {error && (
                <span className="mensajeError">
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
};

const InputFotos = ({
    fotos = [],
    previews = [],
    onAgregar,
    onQuitar,
    error,
    maxFotos,
}) => (
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
                    <button
                        type="button"
                        onClick={() => onQuitar(indice)}
                        className="btnQuitarFoto"
                    >
                        ✕
                    </button>
                </div>
            ))}
            {fotos.length < maxFotos && (
                <label className="zonaAgregarFoto">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={onAgregar}
                    />
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
