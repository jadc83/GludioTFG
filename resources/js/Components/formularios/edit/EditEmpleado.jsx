import Campo from '@/Components/reservas/utilidades/Campo';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function EditEmpleado({ empleado, abierto, onCerrar }) {
    const INITIAL_DATA = {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',

        departamento_id: null,
        role: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
        ciudad: '',
        codigo_postal: '',
        telefono: '',
    };

    const rutaCrear = '/empleados';
    const rutaActualizar = empleado ? `/empleados/${empleado.id}` : '';

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        guardar: enviar,
        cargarDatos,
        limpiar,
    } = useFormGenerico(INITIAL_DATA, rutaCrear, rutaActualizar, () => {
        onCerrar?.();
        limpiar();
    });

    const [roles, setRoles] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);

    useEffect(() => {
        // cargar lista de roles disponibles
        fetch('/api/roles', { credentials: 'same-origin' })
            .then((r) => r.json())
            .then((data) =>
                setRoles(
                    (Array.isArray(data) ? data : []).filter(
                        (r) =>
                            !['admin', 'user'].includes(
                                (r || '').toString().trim().toLowerCase(),
                            ),
                    ),
                ),
            )
            .catch(() => setRoles([]));

        // cargar lista de departamentos
        fetch('/api/departamentos', { credentials: 'same-origin' })
            .then((r) => r.json())
            .then((data) => setDepartamentos(Array.isArray(data) ? data : []))
            .catch(() => setDepartamentos([]));

        if (empleado) {
            cargarDatos({
                name: empleado.name || '',
                email: empleado.email || '',

                departamento_id: empleado.departamento_id || null,

                role:
                    empleado.role ||
                    (empleado.roles && empleado.roles.length
                        ? empleado.roles[0]
                        : ''),
                tipo_documento: empleado.tipo_documento || 'dni',
                numero_documento: empleado.numero_documento || '',
                nacionalidad: empleado.nacionalidad || '',
                direccion: empleado.direccion || '',
                ciudad: empleado.ciudad || '',
                codigo_postal: empleado.codigo_postal || '',
                telefono: empleado.telefono || '',
            });
        } else {
            limpiar();
        }
    }, [empleado, cargarDatos, limpiar]);

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
                role="button"
                tabIndex={0}
                onClick={handleCerrar}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCerrar();
                }}
            />

            <div
                className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}
            >
                <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                            {empleado
                                ? `Editar Empleado: ${empleado.name}`
                                : 'Editar Empleado'}
                        </h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Gestión de Personal
                        </p>
                    </div>
                    <button
                        onClick={handleCerrar}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </header>

                {empleado && (
                    <form
                        onSubmit={enviar}
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
                                    label="Tipo Doc."
                                    as="select"
                                    value={formulario.tipo_documento || ''}
                                    onChange={cambiar}
                                >
                                    {Object.entries(TIPOS_DOCUMENTO).map(
                                        ([clave, valor]) => (
                                            <option key={clave} value={valor}>
                                                {valor.toUpperCase()}
                                            </option>
                                        ),
                                    )}
                                </Campo>
                                <Campo
                                    id="numero_documento"
                                    label="Documento"
                                    value={formulario.numero_documento || ''}
                                    onChange={cambiar}
                                    error={errores.numero_documento}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Campo
                                    id="departamento_id"
                                    name="departamento_id"
                                    label="Departamento"
                                    as="select"
                                    value={formulario.departamento_id || ''}
                                    onChange={cambiar}
                                >
                                    <option value="">Sin departamento</option>
                                    {Array.isArray(departamentos) &&
                                        departamentos.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name.toUpperCase()}
                                            </option>
                                        ))}
                                </Campo>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Campo
                                    id="role"
                                    label="Rol"
                                    as="select"
                                    value={formulario.role || ''}
                                    onChange={cambiar}
                                >
                                    <option value="">Sin rol</option>
                                    {Array.isArray(roles) &&
                                        roles.map((r) => (
                                            <option key={r} value={r}>
                                                {r.toUpperCase()}
                                            </option>
                                        ))}
                                </Campo>

                                <Campo
                                    id="nacionalidad"
                                    label="Nacionalidad"
                                    value={formulario.nacionalidad || ''}
                                    onChange={cambiar}
                                    error={errores.nacionalidad}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Campo
                                    id="telefono"
                                    label="Teléfono"
                                    value={formulario.telefono || ''}
                                    onChange={cambiar}
                                    error={errores.telefono}
                                />
                                <Campo
                                    id="nacionalidad"
                                    label="Nacionalidad"
                                    value={formulario.nacionalidad || ''}
                                    onChange={cambiar}
                                    error={errores.nacionalidad}
                                />
                            </div>

                            <Campo
                                id="direccion"
                                label="Dirección"
                                as="textarea"
                                rows={2}
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
                                    : 'Actualizar Empleado'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
