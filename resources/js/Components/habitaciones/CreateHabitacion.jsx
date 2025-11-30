import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import { useHabitacionForm } from '../../hooks/UseHabitacionForm';
import '@/../css/createHabitacion.css';

export default function CreateHabitacion() {
    const [abierto, setAbierto] = useState(false);
    const [modoContinuo, setModoContinuo] = useState(false);

    const { form, cambiar, errores, guardando, capacidadFija, fotos, previews,
            agregarFotos, quitarFoto, enviar, reset, MAX_FOTOS } = useHabitacionForm(
        null, () => { if (!modoContinuo) {
                    setAbierto(false);
                } else {
                    reset();
                }});

    const handleCerrar = () => {
        setAbierto(false);
        reset();
    };

    return (
        <>
            <PrimaryButton onClick={() => setAbierto(true)}>
                <PlusIcon className="w-5 h-5" />
                Nueva Habitación
            </PrimaryButton>

            <dialog className={`drawer-modal ${abierto ? 'modal-open' : ''}`}>
                <div className={`drawer-panel ${abierto ? 'abierto' : 'cerrado'}`}>
                    <header className="drawer-header">
                        <h3 className="drawer-titulo">Alta de Habitación</h3>
                        <button onClick={handleCerrar} className="btn-cerrar">✕</button>
                    </header>

                    <form onSubmit={enviar} className="form-habitacion">
                        <div className="form-control rounded-box">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input type="checkbox" className="checkbox checkbox-primary checkbox-lg" checked={modoContinuo}
                                    onChange={e => setModoContinuo(e.target.checked)}/>
                                <span className="label-text font-medium">
                                    Creación rápida
                                </span>
                            </label>
                        </div>

                        <div className="form-grid">
                            <Campo id="numero" label="Número" type="text" value={form.numero} onChange={cambiar}
                                error={errores.numero} required placeholder="Ej: 101"/>

                            <Campo id="tipo" label="Tipo" as="select" value={form.tipo} onChange={cambiar} error={errores.tipo}>
                                <option value="doble">Doble</option>
                                <option value="suite">Suite</option>
                                <option value="familiar">Familiar</option>
                            </Campo>

                            <Campo id="precio_noche" label="Precio €" type="number" step="0.01" value={form.precio_noche} onChange={cambiar}
                                error={errores.precio_noche} required />

                            <Campo id="capacidad" label="Capacidad" type="number" min="1" value={form.capacidad} onChange={cambiar}
                                error={errores.capacidad} readOnly={capacidadFija} classNameExtra={capacidadFija ? 'readonly' : ''}/>
                        </div>

                        <Campo id="estado" label="Estado" as="select" value={form.estado} onChange={cambiar} error={errores.estado}>
                            <option value="disponible">Disponible</option>
                            <option value="ocupada">Ocupada</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="limpieza">Limpieza</option>
                        </Campo>

                        <InputFotos fotos={fotos} previews={previews} onAgregar={agregarFotos} onQuitar={quitarFoto}
                            error={errores.fotos} maxFotos={MAX_FOTOS}/>

                        <Campo id="descripcion"  label="Descripción" as="textarea" value={form.descripcion} onChange={cambiar}
                            error={errores.descripcion} placeholder="Detalles públicos..."/>

                        <Campo id="notas" label="Notas Privadas" as="textarea" rows={3} value={form.notas} onChange={cambiar}
                            error={errores.notas} placeholder="Solo uso interno..."/>

                        <PrimaryButton type="submit" className="w-full mt-4">
                            {guardando ? 'Guardando...' : 'Crear Habitación'}
                        </PrimaryButton>
                    </form>
                </div>
            </dialog>
        </>
    );
}

const Campo = ({ id, label, as = 'input', error, classNameExtra = '', children, ...props }) => {

    const InputTag = as;
    const baseClass = as === 'textarea' ? 'campo-textarea' : as === 'select'
                                        ? 'campo-select' : 'campo-input';
    return (
        <div className="campo">
            <label className="campo-label" htmlFor={id}>
                <span className="campo-label-text">{label}</span>
            </label>
            <InputTag id={id} name={id} className={`${baseClass} ${error ? 'error' : ''} ${classNameExtra}`} {...props}>
                {children}
            </InputTag>
            {error && (
                <span className="campo-error">
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
};

const InputFotos = ({ fotos, previews, onAgregar, onQuitar, error, maxFotos }) => (
    <div className="campo">
        <label className="campo-label">
            <span className="campo-label-text">
                Fotos ({fotos.length}/{maxFotos})
            </span>
        </label>
        <div className="fotos-grid">
            {previews.map((src, indice) => (
                <div key={indice} className="foto-preview">
                    <img src={src} alt={`Foto ${indice + 1}`} />
                    <button type="button" onClick={() => onQuitar(i)} className="foto-quitar">✕</button>
                </div>
            ))}
            {fotos.length < maxFotos && (
                <label className="foto-agregar">
                    <input type="file" accept="image/*" multiple hidden onChange={onAgregar} />
                    <span className="foto-agregar-icon">+</span>
                    <span className="foto-agregar-text">Añadir</span>
                </label>
            )}
        </div>
        {error && (
            <span className="campo-error">
                {Array.isArray(error) ? error[0] : error}
            </span>
        )}
    </div>
);
