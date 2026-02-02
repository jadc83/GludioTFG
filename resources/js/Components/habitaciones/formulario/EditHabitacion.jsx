import '@/../css/createHabitacion.css';
import Campo from '@/Components/formulario/Campo';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_HABITACION } from '@/utils/constantes';
import {
    CheckCircleIcon,
    CogIcon,
    LockClosedIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function EditHabitacion({ habitacion, abierto, onCerrar }) {
    const datosIniciales = {
        numero: '',
        tipo: 'doble',
        capacidad: 2,
        estado: 'disponible',
        descripcion: '',
        notas: '',
    };

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        setData,
        guardar,
        cargarDatos,
        limpiar,
    } = useFormGenerico(
        datosIniciales,
        '',
        habitacion ? `/habitaciones/${habitacion.id}` : '',
        () => {
            onCerrar?.();
            limpiar();
        },
    );

    const MAX_FOTOS = 4;
    const [fotosNuevas, setFotosNuevas] = useState([]);
    const [fotosGuardadas, setFotosGuardadas] = useState([]);
    const [fotosAEliminar, setFotosAEliminar] = useState([]);

    useEffect(() => {
        if (habitacion) {
            cargarDatos({
                numero: habitacion.numero || '',
                tipo: habitacion.tipo || 'doble',
                capacidad: habitacion.capacidad || 2,
                estado: habitacion.estado || 'disponible',
                descripcion: habitacion.descripcion || '',
                notas: habitacion.notas || '',
            });
            setFotosGuardadas(
                habitacion.fotos?.map((f) => ({
                    id: f.id,
                    url: f.url || `/storage/${f.ruta}`,
                })) || [],
            );
        }
    }, [habitacion]);

    const tiposHabitacion = usePage().props.tiposHabitacion || {};

    const capacidadFija = useMemo(() => {
        const tipo = (formulario.tipo || '').toString().toLowerCase();
        return Object.prototype.hasOwnProperty.call(tiposHabitacion, tipo);
    }, [formulario.tipo, tiposHabitacion]);

    const previsualizaciones = useMemo(
        () => [
            ...fotosGuardadas.map((f) => f.url),
            ...fotosNuevas.map((f) => URL.createObjectURL(f)),
        ],
        [fotosGuardadas, fotosNuevas],
    );

    const agregarFotos = (e) => {
        const cupoDisp =
            MAX_FOTOS - (fotosGuardadas.length + fotosNuevas.length);
        const nuevosArchivos = Array.from(e.target.files).slice(0, cupoDisp);
        setFotosNuevas((prev) => [...prev, ...nuevosArchivos]);
        e.target.value = '';
    };

    const quitarFoto = (idx) => {
        if (idx < fotosGuardadas.length) {
            const foto = fotosGuardadas[idx];
            if (foto.id) setFotosAEliminar((prev) => [...prev, foto.id]);
            setFotosGuardadas((prev) => prev.filter((_, i) => i !== idx));
        } else {
            setFotosNuevas((prev) =>
                prev.filter((_, i) => i !== idx - fotosGuardadas.length),
            );
        }
    };

    const enviar = (e) => {
        setData('fotos[]', fotosNuevas);
        setData('fotos_eliminar[]', fotosAEliminar);
        guardar(e);
    };

    const handleCerrar = () => {
        onCerrar?.();
        limpiar();
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] transition-all duration-300 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        >
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleCerrar}
            />

            <div
                className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}
            >
                <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                            {habitacion
                                ? `Cambio en Habitación ${habitacion.numero}`
                                : 'Editar Habitación'}
                        </h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Gestión de Activos
                        </p>
                    </div>
                    <button
                        onClick={handleCerrar}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                    >
                        ✕
                    </button>
                </header>

                {habitacion && (
                    <form
                        onSubmit={enviar}
                        className="flex min-h-0 flex-1 flex-col bg-white"
                    >
                        <div className="flex-1 space-y-8 overflow-y-auto p-8">
                            <div className="form-grid">
                                <Campo
                                    id="numero"
                                    label="Número"
                                    type="text"
                                    value={formulario.numero}
                                    onChange={cambiar}
                                    placeholder="Ej: 101"
                                    claseExtra="font-mono"
                                    required
                                    error={errores.numero}
                                    sinEstilosPorDefecto={true}
                                    claseContenedor="contenedorCampo"
                                    claseEtiqueta="etiquetaCampo"
                                    claseError="campo-error"
                                    clase="entradaTexto"
                                />

                                <Campo
                                    id="tipo"
                                    label="Tipo"
                                    as="select"
                                    value={formulario.tipo}
                                    onChange={cambiar}
                                    error={errores.tipo}
                                    sinEstilosPorDefecto={true}
                                    claseContenedor="contenedorCampo"
                                    claseEtiqueta="etiquetaCampo"
                                    claseError="campo-error"
                                    clase="selector"
                                >
                                    {Object.entries(TIPOS_HABITACION).map(
                                        ([clave, valor]) => (
                                            <option key={clave} value={valor}>
                                                {valor.charAt(0).toUpperCase() +
                                                    valor.slice(1)}
                                            </option>
                                        ),
                                    )}
                                </Campo>

                                {capacidadFija ? (
                                    <input
                                        type="hidden"
                                        id="capacidad"
                                        name="capacidad"
                                        value={formulario.capacidad}
                                        readOnly
                                    />
                                ) : (
                                    <Campo
                                        id="capacidad"
                                        label="Capacidad"
                                        type="number"
                                        min="1"
                                        value={formulario.capacidad}
                                        onChange={cambiar}
                                        claseExtra={
                                            capacidadFija
                                                ? 'readonly font-mono'
                                                : 'font-mono'
                                        }
                                        readOnly={capacidadFija}
                                        required
                                        error={errores.capacidad}
                                        sinEstilosPorDefecto={true}
                                        claseContenedor="contenedorCampo"
                                        claseEtiqueta="etiquetaCampo"
                                        claseError="campo-error"
                                        clase="entradaTexto"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="campo-label" htmlFor="estado">
                                    <span className="campo-label-text">
                                        Estado
                                    </span>
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
                                        className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'disponible' ? 'bg-success/10 border-success text-success' : 'hover:border-success/50 border-gray-200'}`}
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
                                        className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'ocupada' ? 'bg-error/10 border-error text-error' : 'hover:border-error/50 border-gray-200'}`}
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
                                        className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'mantenimiento' ? 'bg-warning/10 border-warning text-warning' : 'hover:border-warning/50 border-gray-200'}`}
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
                                        className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${formulario.estado === 'limpieza' ? 'bg-info/10 border-info text-info' : 'hover:border-info/50 border-gray-200'}`}
                                    >
                                        <SparklesIcon className="h-5 w-5" />
                                        <span className="text-sm font-medium">
                                            Limpieza
                                        </span>
                                    </button>
                                </div>

                                {errores.estado && (
                                    <span className="campo-error">
                                        {Array.isArray(errores.estado)
                                            ? errores.estado[0]
                                            : errores.estado}
                                    </span>
                                )}
                            </div>

                            <InputFotos
                                fotos={fotosNuevas}
                                previews={previsualizaciones}
                                fotosGuardadas={fotosGuardadas}
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
                                placeholder="Detalles públicos..."
                                error={errores.descripcion}
                                sinEstilosPorDefecto={true}
                                claseContenedor="contenedorCampo"
                                claseEtiqueta="campo-label"
                                claseError="campo-error"
                                clase="campo-textarea"
                            />

                            <Campo
                                id="notas"
                                label="Notas Privadas"
                                as="textarea"
                                rows={3}
                                value={formulario.notas}
                                onChange={cambiar}
                                placeholder="Solo uso interno..."
                                error={errores.notas}
                                sinEstilosPorDefecto={true}
                                claseContenedor="contenedorCampo"
                                claseEtiqueta="campo-label"
                                claseError="campo-error"
                                clase="campo-textarea"
                            />
                        </div>

                        <div className="flex-none border-t border-gray-100 bg-gray-50 p-6">
                            <button
                                type="submit"
                                disabled={estaCargando}
                                className="w-full rounded-2xl bg-gray-900 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl transition-all hover:bg-[#7a0202] disabled:opacity-50"
                            >
                                {estaCargando
                                    ? 'Guardando...'
                                    : 'Actualizar Habitación'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
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
