import Campo from '@/Components/formulario/Campo';
import PrimaryButton from '@/Components/UI/PrimaryButton';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { router } from '@inertiajs/react';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';
import { UserIcon, MapPinIcon, IdentificationIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const INITIAL_DATA = {
    name: '', email: '',
    tipo_documento: 'dni', numero_documento: '',
    nacionalidad: '', direccion: '', telefono: ''
};

export default function CreateCliente({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);

    const datosIniciales = { name: '', email: '', tipo_documento: 'dni', numero_documento: '', nacionalidad: '', direccion: '', telefono: '' };

    const { formulario, cambiar, errores, estaCargando, guardar, limpiar } = useFormGenerico(
        datosIniciales,
        '/clientes',
        '',
        () => {
            setAbierto(false);
            limpiar();
            router.reload({ only: ['clientes'] });
        }
    );

    const handleCerrar = () => {
        setAbierto(false);
        limpiar();
    };



    return (
        <>
            <button
                onClick={() => setAbierto(true)}
                className={`flex items-center gap-2 bg-[#7a0202] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#5a0101] transition shadow-md ${iconOnly ? 'p-3' : 'px-6 py-3'}`}
                title="Nuevo Cliente"
                aria-label="Nuevo Cliente"
            >
                <UserIcon className="h-5 w-5" /> {!iconOnly && ' Nuevo Cliente'}
            </button>

            {/* CONTENEDOR RAIZ: Z-index extremo para flotar entre header y footer */}
            <div className={`fixed inset-x-0 top-16 bottom-0 z-[9999] transition-all duration-300 ${abierto ? 'visible' : 'invisible'}`}>

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
                                Alta de <span className="text-[#7a0202]">Cliente</span>
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión de Clientes</p>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#7a0202] rounded-2xl transition-all border border-gray-100 shadow-sm"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>



                    {/* Formulario con scroll independiente */}
                    <form onSubmit={guardar} className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">

                            <div className="space-y-6 animate-in fade-in duration-300">
                                <Campo id="name" label="Nombre Completo" value={formulario.name} onChange={cambiar} error={errores.name} required />
                                <Campo id="email" label="Email" type="email" value={formulario.email} onChange={cambiar} error={errores.email} required />

                                <div className="grid grid-cols-2 gap-4">
                                    <Campo id="tipo_documento" label="Tipo Doc." as="select" value={formulario.tipo_documento} onChange={cambiar}>
                                        {Object.entries(TIPOS_DOCUMENTO).map(([clave, valor]) => (
                                            <option key={clave} value={valor}>{valor.toUpperCase()}</option>
                                        ))}
                                    </Campo>
                                    <Campo id="numero_documento" label="Documento" value={formulario.numero_documento} onChange={cambiar} error={errores.numero_documento} required />
                                </div>

                                <Campo id="nacionalidad" label="Nacionalidad" value={formulario.nacionalidad} onChange={cambiar} error={errores.nacionalidad} />

                                <Campo id="telefono" label="Teléfono" value={formulario.telefono} onChange={cambiar} error={errores.telefono} />
                                <Campo id="direccion" label="Dirección" as="textarea" rows={3} value={formulario.direccion} onChange={cambiar} error={errores.direccion} />
                            </div>
                        </div>

                        {/* Footer con botón fijo abajo */}
                        <div className="flex-none p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={estaCargando}
                                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#7a0202] transition-all shadow-xl disabled:opacity-50"
                            >
                                {estaCargando ? 'Procesando...' : 'Guardar Cliente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
