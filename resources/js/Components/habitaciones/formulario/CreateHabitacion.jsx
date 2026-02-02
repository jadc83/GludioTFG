import Campo from '@/Components/formulario/Campo';
import Boton from '@/Components/UI/Boton';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_HABITACION } from '@/utils/constantes';
import {
    DocumentTextIcon,
    HomeIcon,
    PhotoIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CreateHabitacion({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('info');

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
        limpiar,
    } = useFormGenerico(datosIniciales, '/habitaciones', '', () => {
        setAbierto(false);
        limpiar();
        setTabActiva('info');
    });

    const MAX_FOTOS = 4;
    const [fotosNuevas, setFotosNuevas] = useState([]);
    const [fotosGuardadas, setFotosGuardadas] = useState([]);
    const [fotosAEliminar, setFotosAEliminar] = useState([]);

    const previsualizaciones = [
        ...fotosGuardadas.map((f) => f.url),
        ...fotosNuevas.map((f) => URL.createObjectURL(f)),
    ];

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
        // attach files to form data managed by useFormGenerico
        setData('fotos[]', fotosNuevas);
        guardar(e);
    };

    const handleCerrar = () => {
        setAbierto(false);
        limpiar();
        setTabActiva('info');
    };

    const tieneErrores = (campos) => campos.some((campo) => !!errores[campo]);

    const getTabClass = (id, campos) => {
        const esActiva = tabActiva === id;
        const conError = tieneErrores(campos);
        let base =
            'flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-200 ';

        if (conError) {
            return (
                base +
                (esActiva
                    ? 'text-red-600 border-red-600 bg-red-50'
                    : 'text-red-400 border-transparent hover:text-red-500')
            );
        }
        return (
            base +
            (esActiva
                ? 'text-[#7a0202] border-[#7a0202] bg-red-50/30'
                : 'text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50')
        );
    };

    return (
        <>
            <Boton
                onClick={() => setAbierto(true)}
                icon={HomeIcon}
                size={iconOnly ? 'sm' : 'md'}
                className={iconOnly ? '!px-3 !py-3' : ''}
            >
                {!iconOnly && 'Nueva Habitación'}
            </Boton>

            {/* CONTENEDOR RAIZ: Z-index extremo y posicionado bajo el header (top-16) */}
            <div
                className={`fixed inset-x-0 bottom-0 top-16 z-[9999] transition-all duration-300 ${abierto ? 'visible' : 'invisible'}`}
            >
                {/* Fondo oscuro (Backdrop) - ERROR DE SINTAXIS CORREGIDO AQUÍ */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCerrar}
                />

                {/* Panel Lateral (Slide-over) */}
                <div
                    className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}
                >
                    {/* Header estilo Gludio */}
                    <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <h3 className="text-xl font-black uppercase leading-none tracking-tight text-gray-900">
                                Alta de{' '}
                                <span className="text-[#7a0202]">
                                    Habitación
                                </span>
                            </h3>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Gestión de Activos
                            </p>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    {/* Navegación por Pestañas */}
                    <nav className="flex flex-none border-b border-gray-100 bg-white">
                        <button
                            type="button"
                            className={getTabClass('info', [
                                'numero',
                                'tipo',
                                'capacidad',
                            ])}
                            onClick={() => setTabActiva('info')}
                        >
                            <HomeIcon className="h-4 w-4" /> Info
                        </button>
                        <button
                            type="button"
                            className={getTabClass('multimedia', [
                                'fotos',
                                'descripcion',
                            ])}
                            onClick={() => setTabActiva('multimedia')}
                        >
                            <PhotoIcon className="h-4 w-4" /> Multimedia
                        </button>
                        <button
                            type="button"
                            className={getTabClass('admin', [
                                'estado',
                                'notas',
                            ])}
                            onClick={() => setTabActiva('admin')}
                        >
                            <DocumentTextIcon className="h-4 w-4" /> Admin
                        </button>
                    </nav>

                    {/* Formulario con scroll independiente */}
                    <form
                        onSubmit={enviar}
                        className="flex min-h-0 flex-1 flex-col bg-white"
                    >
                        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-8">
                            {/* Pestaña: Información básica */}
                            {tabActiva === 'info' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <Campo
                                        id="numero"
                                        label="Número de Habitación"
                                        value={formulario.numero}
                                        onChange={cambiar}
                                        error={errores.numero}
                                        placeholder="Ej: 101"
                                        required
                                        claseExtra="font-mono text-lg"
                                    />

                                    <Campo
                                        id="tipo"
                                        label="Tipo de Habitación"
                                        as="select"
                                        value={formulario.tipo}
                                        onChange={cambiar}
                                        error={errores.tipo}
                                        required
                                    >
                                        {Object.entries(TIPOS_HABITACION).map(
                                            ([clave, valor]) => (
                                                <option
                                                    key={clave}
                                                    value={valor}
                                                >
                                                    {valor.toUpperCase()}
                                                </option>
                                            ),
                                        )}
                                    </Campo>

                                    <Campo
                                        id="capacidad"
                                        label="Capacidad (Personas)"
                                        type="number"
                                        min="1"
                                        value={formulario.capacidad}
                                        onChange={cambiar}
                                        error={errores.capacidad}
                                        required
                                        claseExtra="font-mono"
                                    />
                                </div>
                            )}

                            {/* Pestaña: Multimedia y Descripción */}
                            {tabActiva === 'multimedia' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <InputFotos
                                        fotos={fotosNuevas}
                                        previews={previsualizaciones}
                                        onAgregar={agregarFotos}
                                        onQuitar={quitarFoto}
                                        error={errores.fotos}
                                        maxFotos={MAX_FOTOS}
                                    />

                                    <Campo
                                        id="descripcion"
                                        label="Descripción Pública"
                                        as="textarea"
                                        rows={4}
                                        value={formulario.descripcion}
                                        onChange={cambiar}
                                        error={errores.descripcion}
                                        placeholder="Detalles atractivos para la web..."
                                    />
                                </div>
                            )}

                            {/* Pestaña: Administración Interna */}
                            {tabActiva === 'admin' && (
                                <div className="animate-in fade-in space-y-6 duration-300">
                                    <Campo
                                        id="estado"
                                        label="Estado Operativo"
                                        as="select"
                                        value={formulario.estado}
                                        onChange={cambiar}
                                        error={errores.estado}
                                        required
                                    >
                                        <option value="disponible">
                                            DISPONIBLE
                                        </option>
                                        <option value="ocupada">OCUPADA</option>
                                        <option value="mantenimiento">
                                            MANTENIMIENTO
                                        </option>
                                        <option value="limpieza">
                                            LIMPIEZA
                                        </option>
                                    </Campo>

                                    <Campo
                                        id="notas"
                                        label="Notas Internas"
                                        as="textarea"
                                        rows={5}
                                        value={formulario.notas}
                                        onChange={cambiar}
                                        error={errores.notas}
                                        placeholder="Incidencias o detalles privados..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer con botón fijo */}
                        <div className="flex-none border-t border-gray-100 bg-gray-50 p-6">
                            <button
                                type="submit"
                                disabled={estaCargando}
                                className="w-full rounded-2xl bg-gray-900 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl transition-all hover:bg-[#7a0202] disabled:opacity-50"
                            >
                                {estaCargando
                                    ? 'Procesando...'
                                    : 'Confirmar Habitación'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

// Subcomponente de Fotos con el estilo visual de la marca
const InputFotos = ({
    fotos = [],
    previews = [],
    onAgregar,
    onQuitar,
    error,
    maxFotos,
}) => (
    <div className="space-y-4">
        <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
            Galería Multimedia{' '}
            <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-600">
                {fotos.length} / {maxFotos}
            </span>
        </label>

        <div className="grid grid-cols-3 gap-3">
            {previews.map((src, indice) => (
                <div
                    key={indice}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm"
                >
                    <img
                        src={src}
                        alt={`Preview ${indice}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    />
                    <button
                        type="button"
                        onClick={() => onQuitar(indice)}
                        className="absolute right-2 top-2 scale-0 rounded-xl bg-white/90 p-1.5 text-gray-500 shadow-md transition-all hover:bg-red-50 hover:text-red-600 group-hover:scale-100"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            ))}

            {fotos.length < maxFotos && (
                <label className="group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 transition-all hover:border-[#7a0202] hover:bg-red-50/30">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={onAgregar}
                    />
                    <PhotoIcon className="h-6 w-6 text-gray-300 transition-colors group-hover:text-[#7a0202]" />
                    <span className="mt-2 text-[9px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-[#7a0202]">
                        Subir
                    </span>
                </label>
            )}
        </div>

        {error && (
            <span className="animate-pulse text-[10px] font-black uppercase tracking-wide text-red-600">
                {Array.isArray(error) ? error[0] : error}
            </span>
        )}
    </div>
);
