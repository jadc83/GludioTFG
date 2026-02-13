import Campo from '@/Components/reservas/utilidades/Campo';

export default function CreateEmpleadoPersonal({ formulario, cambiar, errores }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <Campo id="name" label="Nombre Completo" value={formulario.name} onChange={cambiar} error={errores.name} required />
            <Campo id="email" label="Email Corporativo" type="email" value={formulario.email} onChange={cambiar} error={errores.email} required />

            <div className="grid grid-cols-2 gap-4">
                <Campo id="tipo_documento" label="Tipo Doc." as="select" value={formulario.tipo_documento} onChange={cambiar}>
                    <option value="dni">DNI</option>
                    <option value="passport">PASSPORT</option>
                </Campo>
                <Campo id="numero_documento" label="Documento" value={formulario.numero_documento} onChange={cambiar} error={errores.numero_documento} required />
            </div>

            <div className="mt-4 space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Acceso al Sistema
                <div className="grid grid-cols-2 gap-4">
                    <Campo id="password" label="Contraseña" type="password" value={formulario.password} onChange={cambiar} error={errores.password} />
                    <Campo id="password_confirmation" label="Repetir" type="password" value={formulario.password_confirmation} onChange={cambiar} />
                </div>
            </div>
        </div>
    );
}
