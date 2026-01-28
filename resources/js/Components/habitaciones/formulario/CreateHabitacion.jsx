import Campo from '@/Components/formulario/Campo';
import { useHabitacionForm } from '@/hooks/useHabitacionForm';
import { limpiarFormulario } from '@/hooks/useFormHelpers';
import { TIPOS_HABITACION } from '@/utils/constantes';
import { HomeIcon, PhotoIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CreateHabitacion({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('info');

    const {
        formulario, cambiar, errores, estaCargando, capacidadFija,
        fotos, previsualizaciones, agregarFotos, quitarFoto,
        enviar, reset, clearErrors, MAX_FOTOS
    } = useHabitacionForm(null, () => {
        setAbierto(false);
        limpiarFormulario(reset, clearErrors);
        setTabActiva('info');
    });

    const handleCerrar = () => {
        setAbierto(false);
        limpiarFormulario(reset, clearErrors);
        setTabActiva('info');
    };

    const tieneErrores = (campos) => campos.some(campo => !!errores[campo]);

    const getTabClass = (id, campos) => {
        const esActiva = tabActiva === id;
        const conError = tieneErrores(campos);
        let base = "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-200 ";

        if (conError) {
            return base + (esActiva ? "text-red-600 border-red-600 bg-red-50" : "text-red-400 border-transparent hover:text-red-500");
        }
        return base + (esActiva
            ? "text-[#7a0202] border-[#7a0202] bg-red-50/30"
            : "text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50");
    };

    return (
        <>
            <button
                onClick={() => setAbierto(true)}
                className={`flex items-center gap-2 bg-[#7a0202] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#5a0101] transition shadow-md ${iconOnly ? 'p-3' : 'px-6 py-3'}`}
            >
                <HomeIcon className="h-5 w-5" /> {!iconOnly && ' Nueva Habitación'}
            </button>

            {/* CONTENEDOR RAIZ: Z-index extremo y posicionado bajo el header (top-16) */}
            <div className={`fixed inset-x-0 top-16 bottom-0 z-[9999] transition-all duration-300 ${abierto ? 'visible' : 'invisible'}`}>

                {/* Fondo oscuro (Backdrop) - ERROR DE SINTAXIS CORREGIDO AQUÍ */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCerrar}
                />

                {/* Panel Lateral (Slide-over) */}
                <div className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-500 transform ${abierto ? 'translate-x-0' : 'translate-x-full'} !rounded-l-[2rem] overflow-hidden`}>

                    {/* Header estilo Gludio */}
                    <header className="flex-none p-6 border-b border-gray-100 bg-white flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">
                                Alta de <span className="text-[#7a0202]">Habitación</span>
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión de Activos</p>
                        </div>
                        <button onClick={handleCerrar} className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#7a0202] rounded-2xl transition-all border border-gray-100 shadow-sm">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    {/* Navegación por Pestañas */}
                    <nav className="flex-none flex border-b border-gray-100 bg-white">
                        <button type="button" className={getTabClass('info', ['numero', 'tipo', 'capacidad'])} onClick={() => setTabActiva('info')}>
                            <HomeIcon className="h-4 w-4" /> Info
                        </button>
                        <button type="button" className={getTabClass('multimedia', ['fotos', 'descripcion'])} onClick={() => setTabActiva('multimedia')}>
                            <PhotoIcon className="h-4 w-4" /> Multimedia
                        </button>
                        <button type="button" className={getTabClass('admin', ['estado', 'notas'])} onClick={() => setTabActiva('admin')}>
                            <DocumentTextIcon className="h-4 w-4" /> Admin
                        </button>
                    </nav>

                    {/* Formulario con scroll independiente */}
                    <form onSubmit={enviar} className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                            {/* Pestaña: Información básica */}
                            {tabActiva === 'info' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <Campo id="numero" label="Número de Habitación" value={formulario.numero} onChange={cambiar} error={errores.numero} placeholder="Ej: 101" required claseExtra="font-mono text-lg" />

                                    <Campo id="tipo" label="Tipo de Habitación" as="select" value={formulario.tipo} onChange={cambiar} error={errores.tipo} required>
                                        {Object.entries(TIPOS_HABITACION).map(([clave, valor]) => (
                                            <option key={clave} value={valor}>{valor.toUpperCase()}</option>
                                        ))}
                                    </Campo>

                                    {!capacidadFija ? (
                                        <Campo id="capacidad" label="Capacidad (Personas)" type="number" min="1" value={formulario.capacidad} onChange={cambiar} error={errores.capacidad} required claseExtra="font-mono" />
                                    ) : (
                                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Capacidad fija según tipo</p>
                                            <p className="font-mono font-bold text-lg text-gray-700">{formulario.capacidad} Personas</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pestaña: Multimedia y Descripción */}
                            {tabActiva === 'multimedia' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <InputFotos fotos={fotos} previews={previsualizaciones} onAgregar={agregarFotos} onQuitar={quitarFoto} error={errores.fotos} maxFotos={MAX_FOTOS} />

                                    <Campo id="descripcion" label="Descripción Pública" as="textarea" rows={4} value={formulario.descripcion} onChange={cambiar} error={errores.descripcion} placeholder="Detalles atractivos para la web..." />
                                </div>
                            )}

                            {/* Pestaña: Administración Interna */}
                            {tabActiva === 'admin' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <Campo id="estado" label="Estado Operativo" as="select" value={formulario.estado} onChange={cambiar} error={errores.estado} required>
                                        <option value="disponible">DISPONIBLE</option>
                                        <option value="ocupada">OCUPADA</option>
                                        <option value="mantenimiento">MANTENIMIENTO</option>
                                        <option value="limpieza">LIMPIEZA</option>
                                    </Campo>

                                    <Campo id="notas" label="Notas Internas" as="textarea" rows={5} value={formulario.notas} onChange={cambiar} error={errores.notas} placeholder="Incidencias o detalles privados..." />
                                </div>
                            )}
                        </div>

                        {/* Footer con botón fijo */}
                        <div className="flex-none p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={estaCargando}
                                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#7a0202] transition-all shadow-xl disabled:opacity-50"
                            >
                                {estaCargando ? 'Procesando...' : 'Confirmar Habitación'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

// Subcomponente de Fotos con el estilo visual de la marca
const InputFotos = ({ fotos = [], previews = [], onAgregar, onQuitar, error, maxFotos }) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex justify-between items-center">
            Galería Multimedia <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-600">{fotos.length} / {maxFotos}</span>
        </label>

        <div className="grid grid-cols-3 gap-3">
            {previews.map((src, indice) => (
                <div key={indice} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
                    <img src={src} alt={`Preview ${indice}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                    <button
                        type="button"
                        onClick={() => onQuitar(indice)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl shadow-md transition-all scale-0 group-hover:scale-100"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            ))}

            {fotos.length < maxFotos && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#7a0202] hover:bg-red-50/30 transition-all cursor-pointer group">
                    <input type="file" accept="image/*" multiple hidden onChange={onAgregar} />
                    <PhotoIcon className="h-6 w-6 text-gray-300 group-hover:text-[#7a0202] transition-colors" />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400 mt-2 group-hover:text-[#7a0202]">Subir</span>
                </label>
            )}
        </div>

        {error && (
            <span className="text-red-600 text-[10px] font-black uppercase tracking-wide animate-pulse">
                {Array.isArray(error) ? error[0] : error}
            </span>
        )}
    </div>
);
