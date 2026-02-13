import Campo from '@/Components/reservas/utilidades/Campo';

export default function CreateEmpleadoLaboral({ formulario, cambiar, errores, departamentos, roles }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <div className="grid grid-cols-2 gap-4">
                <Campo id="departamento_id" name="departamento_id" label="Departamento" as="select" value={formulario.departamento_id} onChange={cambiar} error={errores.departamento_id}>
                    <option value="">Seleccionar departamento</option>
                    {Array.isArray(departamentos) && departamentos.map((d) => (
                        <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>
                    ))}
                </Campo>
                <Campo id="role" label="Rol" as="select" value={formulario.role} onChange={cambiar} error={errores.role}>
                    <option value="">Seleccionar rol</option>
                    {Array.isArray(roles) && roles.map((r) => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                    ))}
                </Campo>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Campo id="nacionalidad" label="Nacionalidad" value={formulario.nacionalidad} onChange={cambiar} />
            </div>
        </div>
    );
}
