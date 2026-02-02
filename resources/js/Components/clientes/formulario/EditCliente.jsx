import Campo from '@/Components/formulario/Campo';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function EditCliente({ cliente, abierto, onCerrar }) {
    const datosIniciales = {
        name: '',
        email: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
        telefono: '',
    };

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        cargarDatos,
        guardar,
        limpiar,
    } = useFormGenerico(
        datosIniciales,
        '',
        cliente ? `/clientes/${cliente.id}` : '',
        () => {
            onCerrar?.();
            limpiar();
            router.reload({ only: ['clientes'] });
        },
    );

    // Pre-fill when cliente changes
    useEffect(() => {
        if (cliente) {
            cargarDatos({
                name: cliente.name || '',
                email: cliente.email || '',
                tipo_documento: cliente.tipo_documento || 'dni',
                numero_documento: cliente.numero_documento || '',
                nacionalidad: cliente.nacionalidad || '',
                direccion: cliente.direccion || '',
                telefono: cliente.telefono || '',
            });
        } else {
            limpiar();
        }
    }, [cliente?.id]);

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
                className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}
            >
                <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                            {cliente
                                ? `Editar Cliente: ${cliente.name}`
                                : 'Editar Cliente'}
                        </h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Gestión de Clientes
                        </p>
                    </div>
                    <button
                        onClick={handleCerrar}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                    >
                        ✕
                    </button>
                </header>

                {cliente && (
                    <form
                        onSubmit={guardar}
                        className="flex min-h-0 flex-1 flex-col bg-white"
                    >
                        <div className="flex-1 space-y-6 overflow-y-auto p-8">
                            <Campo
                                id="name"
                                label="Nombre Completo"
                                value={formulario.name || ''}
                                onChange={cambiar}
                                error={errores.name}
                                required
                            />

                            <Campo
                                id="email"
                                label="Email"
                                type="email"
                                value={formulario.email || ''}
                                onChange={cambiar}
                                error={errores.email}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Campo
                                    id="tipo_documento"
                                    label="Tipo Documento"
                                    as="select"
                                    value={formulario.tipo_documento || ''}
                                    onChange={cambiar}
                                    error={errores.tipo_documento}
                                    required
                                >
                                    <option value="">Selecciona tipo</option>
                                    {Object.entries(TIPOS_DOCUMENTO).map(
                                        ([clave, valor]) => (
                                            <option key={clave} value={valor}>
                                                {valor.charAt(0).toUpperCase() +
                                                    valor.slice(1)}
                                            </option>
                                        ),
                                    )}
                                </Campo>
                                <Campo
                                    id="numero_documento"
                                    label="Número Documento"
                                    value={formulario.numero_documento || ''}
                                    onChange={cambiar}
                                    error={errores.numero_documento}
                                    required
                                    claseExtra="font-mono"
                                />
                            </div>

                            <Campo
                                id="nacionalidad"
                                label="Nacionalidad"
                                value={formulario.nacionalidad || ''}
                                onChange={cambiar}
                                error={errores.nacionalidad}
                            />

                            <Campo
                                id="telefono"
                                label="Teléfono"
                                type="tel"
                                value={formulario.telefono || ''}
                                onChange={cambiar}
                                error={errores.telefono}
                                claseExtra="font-mono"
                            />

                            <Campo
                                id="direccion"
                                label="Dirección"
                                as="textarea"
                                rows={3}
                                value={formulario.direccion || ''}
                                onChange={cambiar}
                                error={errores.direccion}
                            />
                        </div>

                        <div className="flex-none border-t border-gray-100 bg-gray-50 p-6">
                            <button
                                type="submit"
                                disabled={estaCargando}
                                className="w-full rounded-2xl bg-gray-900 py-5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl transition-all hover:bg-[#7a0202] disabled:opacity-50"
                            >
                                {estaCargando
                                    ? 'Actualizando...'
                                    : 'Actualizar Cliente'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
