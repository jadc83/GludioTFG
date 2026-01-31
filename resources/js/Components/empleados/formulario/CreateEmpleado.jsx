import Campo from '@/Components/formulario/Campo';

import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';
import { BriefcaseIcon, UserIcon, MapPinIcon, IdentificationIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const INITIAL_DATA = {
    name: '', email: '', password: '', password_confirmation: '',
    numero_empleado: '', departamento: '', puesto: '',
    tipo_documento: 'dni', numero_documento: '',
    nacionalidad: '', direccion: '', ciudad: '', codigo_postal: '', telefono: ''
};

export default function CreateEmpleado({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('personal');

    const { formulario, cambiar, errores, estaCargando, guardar: enviar, limpiar } = useFormGenerico(
        INITIAL_DATA,
        '/empleados',
        '',
        () => {
            setAbierto(false);
            limpiar();
            setTabActiva('personal');
        }
    );

    const handleCerrar = () => {
        setAbierto(false);
        limpiar();
        setTabActiva('personal');
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
                title="Nuevo Empleado"
                aria-label="Nuevo Empleado"
            >
                <BriefcaseIcon className="h-5 w-5" /> {!iconOnly && ' Nuevo Empleado'}
            </button>

            {/* CONTENEDOR RAIZ: Z-index extremo para flotar entre header y footer */}
            <div className={`fixed inset-x-0 top-16 bottom-0 z-[9999] transition-all duration-300 ${abierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

                {/* Backdrop (Oscurecimiento del fondo) */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCerrar}
                />

                {/* Panel Lateral (Slide-over) */}
                <div className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-500 transform ${abierto ? 'translate-x-0' : 'translate-x-full'} !rounded-l-[2rem] overflow-hidden`}>

                    {/* Header estilo Gludio */}
                    <header className="flex-none p-6 border-b border-gray-100 bg-white flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                Alta de <span className="text-[#7a0202]">Empleado</span>
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión de Personal</p>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#7a0202] rounded-2xl transition-all border border-gray-100 shadow-sm"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    {/* Navegación por Pestañas */}
                    <nav className="flex-none flex border-b border-gray-100 bg-white">
                        <button type="button" className={getTabClass('personal', ['name', 'email', 'numero_documento'])} onClick={() => setTabActiva('personal')}>
                            <UserIcon className="h-4 w-4" /> Personal
                        </button>
                        <button type="button" className={getTabClass('laboral', ['numero_empleado', 'departamento', 'puesto'])} onClick={() => setTabActiva('laboral')}>
                            <IdentificationIcon className="h-4 w-4" /> Laboral
                        </button>
                        <button type="button" className={getTabClass('contacto', ['telefono', 'direccion', 'ciudad'])} onClick={() => setTabActiva('contacto')}>
                            <MapPinIcon className="h-4 w-4" /> Contacto
                        </button>
                    </nav>

                    {/* Formulario con scroll independiente */}
                    <form onSubmit={enviar} className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">

                            {/* Pestaña: Datos Personales */}
                            {tabActiva === 'personal' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <Campo id="name" label="Nombre Completo" value={formulario.name} onChange={cambiar} error={errores.name} required />
                                    <Campo id="email" label="Email Corporativo" type="email" value={formulario.email} onChange={cambiar} error={errores.email} required />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Campo id="tipo_documento" label="Tipo Doc." as="select" value={formulario.tipo_documento} onChange={cambiar}>
                                            {Object.entries(TIPOS_DOCUMENTO).map(([clave, valor]) => (
                                                <option key={clave} value={valor}>{valor.toUpperCase()}</option>
                                            ))}
                                        </Campo>
                                        <Campo id="numero_documento" label="Documento" value={formulario.numero_documento} onChange={cambiar} error={errores.numero_documento} required />
                                    </div>

                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 mt-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                        Acceso al Sistema
                                        <div className="grid grid-cols-2 gap-4">
                                            <Campo id="password" label="Contraseña" type="password" value={formulario.password} onChange={cambiar} error={errores.password} />
                                            <Campo id="password_confirmation" label="Repetir" type="password" value={formulario.password_confirmation} onChange={cambiar} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pestaña: Información Laboral */}
                            {tabActiva === 'laboral' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Campo id="numero_empleado" label="ID Empleado" value={formulario.numero_empleado} onChange={cambiar} error={errores.numero_empleado} required />
                                        <Campo id="departamento" label="Departamento" value={formulario.departamento} onChange={cambiar} error={errores.departamento} />
                                    </div>
                                    <Campo id="puesto" label="Puesto / Cargo" value={formulario.puesto} onChange={cambiar} error={errores.puesto} />
                                    <Campo id="nacionalidad" label="Nacionalidad" value={formulario.nacionalidad} onChange={cambiar} />
                                </div>
                            )}

                            {/* Pestaña: Contacto y Ubicación */}
                            {tabActiva === 'contacto' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <Campo id="telefono" label="Teléfono de Contacto" value={formulario.telefono} onChange={cambiar} error={errores.telefono} />
                                    <Campo id="direccion" label="Dirección Postal" as="textarea" rows={3} value={formulario.direccion} onChange={cambiar} error={errores.direccion} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Campo id="ciudad" label="Ciudad" value={formulario.ciudad} onChange={cambiar} />
                                        <Campo id="codigo_postal" label="C.P." value={formulario.codigo_postal} onChange={cambiar} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer con botón fijo abajo */}
                        <div className="flex-none p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={estaCargando}
                                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#7a0202] transition-all shadow-xl disabled:opacity-50"
                            >
                                {estaCargando ? 'Procesando...' : 'Finalizar Alta de Empleado'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
