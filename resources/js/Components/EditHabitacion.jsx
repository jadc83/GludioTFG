import PrimaryButton from '@/Components/PrimaryButton';
import '@/../css/createHabitacion.css';
import useEditHabitacion from '@/hooks/useEditHabitacion';
import {
    CheckCircleIcon,
    LockClosedIcon,
    CogIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function EditHabitacion({ habitacion, abierto, onCerrar }) {

    const { data, ui, actions } = useEditHabitacion(habitacion, abierto, onCerrar);

    return (
        <dialog className={`drawer-modal ${abierto ? 'modal-open' : ''}`}>
            <div className={`drawer-panel ${abierto ? 'abierto' : 'cerrado'}`}>
                <header className="drawer-header">
                    <h3 className="drawer-titulo">
                        {habitacion ? `Cambio en Habitación ${habitacion.numero}` : 'Editar Habitación'}
                    </h3>
                    <button onClick={onCerrar} className="btn-cerrar">✕</button>
                </header>

                {habitacion && (
                    <form onSubmit={actions.enviar} className="form-habitacion">
                        <div className="form-grid">

                            <div className="campo">
                                <label className="campo-label" htmlFor="numero"><span className="campo-label-text">Número</span></label>
                                <input id="numero" name="numero" type="text" value={data.form.numero} onChange={actions.cambiar} placeholder="Ej: 101"
                                    className={`campo-input ${ui.errores.numero ? 'error' : ''}`} required/>
                                {ui.errores.numero && <span className="campo-error">{ui.errores.numero[0]}</span>}
                            </div>

                            <div className="campo">
                                <label className="campo-label" htmlFor="tipo"><span className="campo-label-text">Tipo</span></label>
                                <select id="tipo" name="tipo" value={data.form.tipo} onChange={actions.cambiar}
                                    className={`campo-select ${ui.errores.tipo ? 'error' : ''}`}>
                                    <option value="doble">Doble</option>
                                    <option value="suite">Suite</option>
                                    <option value="familiar">Familiar</option>
                                </select>
                                {ui.errores.tipo && <span className="campo-error">{ui.errores.tipo[0]}</span>}
                            </div>

                            <div className="campo">
                                <label className="campo-label" htmlFor="precio_noche"><span className="campo-label-text">Precio (€)</span></label>
                                <input id="precio_noche" name="precio_noche" type="number" step="0.01" value={data.form.precio_noche}
                                    onChange={actions.cambiar} className={`campo-input ${ui.errores.precio_noche ? 'error' : ''}`} required/>
                                {ui.errores.precio_noche && <span className="campo-error">{ui.errores.precio_noche[0]}</span>}
                            </div>

                            <div className="campo">
                                <label className="campo-label" htmlFor="capacidad"><span className="campo-label-text">Capacidad</span></label>
                                <input id="capacidad" name="capacidad" type="number" min="1" value={data.form.capacidad}
                                    onChange={actions.cambiar} className={`campo-input ${ui.errores.capacidad ? 'error' : ''} ${data.capacidadFija ? 'readonly' : ''}`}
                                    readOnly={data.capacidadFija} required />
                                {ui.errores.capacidad && <span className="campo-error">{ui.errores.capacidad[0]}</span>}
                            </div>
                        </div>

                        <div className="campo">
                            <label className="campo-label" htmlFor="estado">
                                <span className="campo-label-text">Estado</span>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => actions.cambiar({ target: { name: 'estado', value: 'disponible' } })}
                                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                        data.form.estado === 'disponible'
                                            ? 'border-success bg-success/10 text-success'
                                            : 'border-gray-200 hover:border-success/50'
                                    }`}>
                                    <CheckCircleIcon className="w-5 h-5" />
                                    <span className="text-sm font-medium">Disponible</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => actions.cambiar({ target: { name: 'estado', value: 'ocupada' } })}
                                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                        data.form.estado === 'ocupada'
                                            ? 'border-error bg-error/10 text-error'
                                            : 'border-gray-200 hover:border-error/50'
                                    }`}>
                                    <LockClosedIcon className="w-5 h-5" />
                                    <span className="text-sm font-medium">Ocupada</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => actions.cambiar({ target: { name: 'estado', value: 'mantenimiento' } })}
                                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                        data.form.estado === 'mantenimiento'
                                            ? 'border-warning bg-warning/10 text-warning'
                                            : 'border-gray-200 hover:border-warning/50'
                                    }`}>
                                    <CogIcon className="w-5 h-5" />
                                    <span className="text-sm font-medium">Mantenimiento</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => actions.cambiar({ target: { name: 'estado', value: 'limpieza' } })}
                                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                        data.form.estado === 'limpieza'
                                            ? 'border-info bg-info/10 text-info'
                                            : 'border-gray-200 hover:border-info/50'
                                    }`}>
                                    <SparklesIcon className="w-5 h-5" />
                                    <span className="text-sm font-medium">Limpieza</span>
                                </button>
                            </div>

                            {ui.errores.estado && <span className="campo-error">{ui.errores.estado[0]}</span>}
                        </div>

                        <InputFotos fotos={data.fotos} previews={data.previews} existingFotos={data.existingFotos}
                            onAgregar={actions.agregarFotos} onQuitar={actions.quitarFoto} error={ui.errores.fotos}
                            maxFotos={data.MAX_FOTOS}/>

                        <div className="campo">
                            <label className="campo-label" htmlFor="descripcion"><span className="campo-label-text">Descripción</span></label>
                            <textarea id="descripcion" name="descripcion" value={data.form.descripcion} onChange={actions.cambiar}
                                placeholder="Detalles públicos..." className={`campo-textarea ${ui.errores.descripcion ? 'error' : ''}`} />
                            {ui.errores.descripcion && <span className="campo-error">{ui.errores.descripcion[0]}</span>}
                        </div>

                        <div className="campo">
                            <label className="campo-label" htmlFor="notas"><span className="campo-label-text">Notas Privadas</span></label>
                            <textarea id="notas" name="notas" rows={3} value={data.form.notas} onChange={actions.cambiar}
                                placeholder="Solo uso interno..." className={`campo-textarea ${ui.errores.notas ? 'error' : ''}`}/>
                            {ui.errores.notas && <span className="campo-error">{ui.errores.notas[0]}</span>}
                        </div>

                        <PrimaryButton type="submit">
                            {ui.guardando ? 'Guardando...' : 'Actualizar Habitación'}
                        </PrimaryButton>
                    </form>
                )}
            </div>
        </dialog>
    );
}

const InputFotos = ({ fotos, previews, existingFotos = [], onAgregar, onQuitar, error, maxFotos }) => {
    const totalFotos = (existingFotos?.length || 0) + (fotos?.length || 0);

    return (
        <div className="campo">
            <label className="campo-label">Fotos ({previews?.length || 0}/{maxFotos})</label>
            <div className="fotos-grid">
                {(previews || []).map((src, i) => (
                    <div key={i} className="foto-preview">
                        <img src={src} alt={`Foto ${i + 1}`} />
                        <button type="button" onClick={() => onQuitar(i)} className="foto-quitar">✕</button>
                    </div>
                ))}
                {totalFotos < maxFotos && (
                    <label className="foto-agregar">
                        <input type="file" accept="image/*" multiple hidden onChange={onAgregar} />
                        <span className="foto-agregar-icon">+</span>
                        <span className="foto-agregar-text">Añadir</span>
                    </label>
                )}
            </div>
            {error && <span className="campo-error">{error}</span>}
        </div>
    );
};
