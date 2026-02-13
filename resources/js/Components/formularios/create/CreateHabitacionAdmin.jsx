import Campo from '@/Components/reservas/utilidades/Campo';

export default function CreateHabitacionAdmin({ formulario, cambiar, errores }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <Campo id="estado" label="Estado Operativo" as="select" value={formulario.estado} onChange={cambiar} error={errores.estado} required>
                <option value="disponible">DISPONIBLE</option>
                <option value="ocupada">OCUPADA</option>
                <option value="mantenimiento">MANTENIMIENTO</option>
                <option value="limpieza">LIMPIEZA</option>
            </Campo>

            <Campo id="notas" label="Notas Internas" as="textarea" rows={5} value={formulario.notas} onChange={cambiar} error={errores.notas} placeholder="Incidencias o detalles privados..." />
        </div>
    );
}
