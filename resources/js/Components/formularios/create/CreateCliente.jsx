import Campo from '@/Components/reservas/utilidades/Campo';
import Boton from '@/Components/UI/Boton';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function CreateCliente({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);

    const datosIniciales = {
        name: '',
        email: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
        telefono: '',
    };

    const { formulario, cambiar, errores, estaCargando, guardar, limpiar } =
        useFormGenerico(datosIniciales, '/clientes', '', () => {
            setAbierto(false);
            limpiar();
            router.reload({ only: ['clientes'] });
        });

    const handleCerrar = () => {
        setAbierto(false);
        limpiar();
    };

    return (
        <>
            <Boton
                onClick={() => setAbierto(true)}
                icon={UserIcon}
                size={iconOnly ? 'sm' : 'md'}
                className={iconOnly ? '!px-3 !py-3' : ''}
                title="Nuevo Cliente"
                aria-label="Nuevo Cliente"
            >
                {!iconOnly && 'Nuevo Cliente'}
            </Boton>

            <div
                className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-300 md:top-16 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-client-title"
            >
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleCerrar}
                    aria-hidden="true"
                />

                <div
                    className={`absolute inset-0 flex w-full max-w-full transform flex-col bg-white shadow-2xl transition-transform duration-500 md:bottom-0 md:left-auto md:right-0 md:top-0 md:max-w-md ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden rounded-none md:!rounded-l-[2rem]`}
                >
                    <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <h3
                                className="text-xl font-black uppercase tracking-tight text-gray-900"
                                id="create-client-title"
                            >
                                Alta de{' '}
                                <span className="text-[#7a0202]">Cliente</span>
                            </h3>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Gestión de Clientes
                            </p>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                            aria-label="Cerrar panel crear cliente"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    <form
                        onSubmit={guardar}
                        aria-label="Formulario crear cliente"
                        className="flex min-h-0 flex-1 flex-col bg-white"
                    >
                        <div className="flex-1 space-y-8 overflow-y-auto p-8">
                            <div className="animate-in fade-in space-y-6 duration-300">
                                <Campo
                                    id="name"
                                    label="Nombre Completo"
                                    value={formulario.name}
                                    onChange={cambiar}
                                    error={errores.name}
                                    required
                                />
                                <Campo
                                    id="email"
                                    label="Email"
                                    type="email"
                                    value={formulario.email}
                                    onChange={cambiar}
                                    error={errores.email}
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Campo
                                        id="tipo_documento"
                                        label="Tipo Doc."
                                        as="select"
                                        value={formulario.tipo_documento}
                                        onChange={cambiar}
                                    >
                                        {Object.entries(TIPOS_DOCUMENTO).map(
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
                                        id="numero_documento"
                                        label="Documento"
                                        value={formulario.numero_documento}
                                        onChange={cambiar}
                                        error={errores.numero_documento}
                                        required
                                    />
                                </div>

                                <Campo
                                    id="nacionalidad"
                                    label="Nacionalidad"
                                    value={formulario.nacionalidad}
                                    onChange={cambiar}
                                    error={errores.nacionalidad}
                                />

                                <Campo
                                    id="telefono"
                                    label="Teléfono"
                                    value={formulario.telefono}
                                    onChange={cambiar}
                                    error={errores.telefono}
                                />
                                <Campo
                                    id="direccion"
                                    label="Dirección"
                                    as="textarea"
                                    rows={3}
                                    value={formulario.direccion}
                                    onChange={cambiar}
                                    error={errores.direccion}
                                />
                            </div>
                        </div>

                        <div className="flex-none border-t border-gray-100 bg-gray-50 p-6">
                            <button
                                type="submit"
                                aria-label="Guardar cliente"
                                disabled={estaCargando}
                                className="w-full rounded-2xl bg-gray-900 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl transition-all hover:bg-[#7a0202] disabled:opacity-50"
                            >
                                {estaCargando
                                    ? 'Procesando...'
                                    : 'Guardar Cliente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
