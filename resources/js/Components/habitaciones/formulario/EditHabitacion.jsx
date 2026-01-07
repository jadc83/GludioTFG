import '@/../css/createHabitacion.css';
import PrimaryButton from '@/Components/PrimaryButton';
import { useHabitacionForm } from '@/hooks/useHabitacionForm';
import { TIPOS_HABITACION } from '@/utils/constantes';
import {
    CheckCircleIcon,
    CogIcon,
    LockClosedIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export default function EditHabitacion({ habitacion, abierto, onCerrar }) {
    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        capacidadFija,
        fotos,
        previsualizaciones,
        fotosGuardadas,
        agregarFotos,
        quitarFoto,
        enviar,
    } = useHabitacionForm(habitacion, onCerrar);

    return (
        <dialog className={`drawer-modal ${abierto ? 'modal-open' : ''}`}>
            <div className={`drawer-panel ${abierto ? 'abierto' : 'cerrado'}`}>
                <header className="drawer-header">
                    <h3 className="drawer-titulo">
                        {habitacion
                            ? `Cambio en Habitación ${habitacion.numero}`
                            : 'Editar Habitación'}
                    </h3>
                    <button onClick={onCerrar} className="btn-cerrar">
                        ✕
                    </button>
                </header>

                {habitacion && (
                    <form onSubmit={enviar} className="form-habitacion">
                        <div className="form-grid">
                            <div className="campo">
                                <label className="campo-label" htmlFor="numero">
                                    <span className="campo-label-text">
                                        Número
                                    </span>
                                </label>
                                <input
                                    id="numero"
                                    name="numero"
                                    type="text"
                                    value={formulario.numero}
                                    onChange={cambiar}
                                    placeholder="Ej: 101"
                                    className={`campo-input font-mono ${errores.numero ? 'error' : ''}`}
                                    required
                                />
                                {errores.numero && (
                                    <span className="campo-error">
                                        {errores.numero[0]}
                                    </span>
                                )}
                            </div>

                            <div className="campo">
                                <label className="campo-label" htmlFor="tipo">
                                    <span className="campo-label-text">
                                        Tipo
                                    </span>
                                </label>
                                <select
                                    id="tipo"
                                    name="tipo"
                                    value={formulario.tipo}
                                    onChange={cambiar}
                                    className={`campo-select ${errores.tipo ? 'error' : ''}`}
                                >
                                    {Object.entries(TIPOS_HABITACION).map(([clave, valor]) => (
                                        <option key={clave} value={valor}>
                                            {valor.charAt(0).toUpperCase() + valor.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                {errores.tipo && (
                                    <span className="campo-error">
                                        {errores.tipo[0]}
                                    </span>
                                )}
                            </div>

                            <div className="campo">
                                <label
                                    className="campo-label"
                                    htmlFor="precio_noche"
                                >
                                    <span className="campo-label-text">
                                        Precio (€)
                                    </span>
                                </label>
                                <input
                                    id="precio_noche"
                                    name="precio_noche"
                                    type="number"
                                    step="0.01"
                                    value={formulario.precio_noche}
                                    onChange={cambiar}
                                    className={`campo-input font-mono ${errores.precio_noche ? 'error' : ''}`}
                                    required
                                />
                                {errores.precio_noche && (
                                    <span className="campo-error">
                                        {errores.precio_noche[0]}
                                    </span>
                                )}
                            </div>

                            <div className="campo">
                                <label
                                    className="campo-label"
                                    htmlFor="capacidad"
                                >
                                    <span className="campo-label-text">
                                        Capacidad
                                    </span>
                                </label>
                                <input
                                    id="capacidad"
                                    name="capacidad"
                                    type="number"
                                    min="1"
                                    value={formulario.capacidad}
                                    onChange={cambiar}
                                    className={`campo-input font-mono ${errores.capacidad ? 'error' : ''} ${capacidadFija ? 'readonly' : ''}`}
                                    readOnly={capacidadFija}
                                    required
                                />
                                {errores.capacidad && (
                                    <span className="campo-error">
                                        {errores.capacidad[0]}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="campo">
                            <label className="campo-label" htmlFor="estado">
                                <span className="campo-label-text">Estado</span>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiar({
                                            target: {
                                                name: 'estado',
                                                value: 'disponible',
                                            },
                                        })
                                    }
                                    className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                        formulario.estado === 'disponible'
                                            ? 'bg-success/10 border-success text-success'
                                            : 'hover:border-success/50 border-gray-200'
                                    }`}
                                >
                                    <CheckCircleIcon className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Disponible
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiar({
                                            target: {
                                                name: 'estado',
                                                value: 'ocupada',
                                            },
                                        })
                                    }
                                    className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                        formulario.estado === 'ocupada'
                                            ? 'bg-error/10 border-error text-error'
                                            : 'hover:border-error/50 border-gray-200'
                                    }`}
                                >
                                    <LockClosedIcon className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Ocupada
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiar({
                                            target: {
                                                name: 'estado',
                                                value: 'mantenimiento',
                                            },
                                        })
                                    }
                                    className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                        formulario.estado === 'mantenimiento'
                                            ? 'bg-warning/10 border-warning text-warning'
                                            : 'hover:border-warning/50 border-gray-200'
                                    }`}
                                >
                                    <CogIcon className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Mantenimiento
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiar({
                                            target: {
                                                name: 'estado',
                                                value: 'limpieza',
                                            },
                                        })
                                    }
                                    className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                        formulario.estado === 'limpieza'
                                            ? 'bg-info/10 border-info text-info'
                                            : 'hover:border-info/50 border-gray-200'
                                    }`}
                                >
                                    <SparklesIcon className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Limpieza
                                    </span>
                                </button>
                            </div>

                            {errores.estado && (
                                <span className="campo-error">
                                    {errores.estado[0]}
                                </span>
                            )}
                        </div>

                        <InputFotos
                            fotos={fotos}
                            previews={previsualizaciones}
                            fotosGuardadas={fotosGuardadas}
                            onAgregar={agregarFotos}
                            onQuitar={quitarFoto}
                            error={errores.fotos}
                            maxFotos={4}
                        />

                        <div className="campo">
                            <label
                                className="campo-label"
                                htmlFor="descripcion"
                            >
                                <span className="campo-label-text">
                                    Descripción
                                </span>
                            </label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={cambiar}
                                placeholder="Detalles públicos..."
                                className={`campo-textarea ${errores.descripcion ? 'error' : ''}`}
                            />
                            {errores.descripcion && (
                                <span className="campo-error">
                                    {errores.descripcion[0]}
                                </span>
                            )}
                        </div>

                        <div className="campo">
                            <label className="campo-label" htmlFor="notas">
                                <span className="campo-label-text">
                                    Notas Privadas
                                </span>
                            </label>
                            <textarea
                                id="notas"
                                name="notas"
                                rows={3}
                                value={formulario.notas}
                                onChange={cambiar}
                                placeholder="Solo uso interno..."
                                className={`campo-textarea ${errores.notas ? 'error' : ''}`}
                            />
                            {errores.notas && (
                                <span className="campo-error">
                                    {errores.notas[0]}
                                </span>
                            )}
                        </div>

                        <PrimaryButton type="submit" className="w-full">
                            {estaCargando
                                ? 'Guardando...'
                                : 'Actualizar Habitación'}
                        </PrimaryButton>
                    </form>
                )}
            </div>
        </dialog>
    );
}

const InputFotos = ({
    fotos,
    previews,
    fotosGuardadas = [],
    onAgregar,
    onQuitar,
    error,
    maxFotos,
}) => {
    const totalFotos = (fotosGuardadas?.length || 0) + (fotos?.length || 0);

    return (
        <div className="campo">
            <label className="campo-label">
                Fotos ({previews?.length || 0}/{maxFotos})
            </label>
            <div className="fotos-grid">
                {(previews || []).map((src, i) => (
                    <div key={i} className="foto-preview">
                        <img src={src} alt={`Foto ${i + 1}`} />
                        <button
                            type="button"
                            onClick={() => onQuitar(i)}
                            className="foto-quitar"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                {totalFotos < maxFotos && (
                    <label className="foto-agregar">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={onAgregar}
                        />
                        <span className="foto-agregar-icon">+</span>
                        <span className="foto-agregar-text">Añadir</span>
                    </label>
                )}
            </div>
            {error && <span className="campo-error">{error}</span>}
        </div>
    );
};
