import Campo from '@/Components/reservas/utilidades/Campo';

export default function CreateEmpleadoContacto({ formulario, cambiar, errores }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <Campo id="telefono" label="Teléfono de Contacto" value={formulario.telefono} onChange={cambiar} error={errores.telefono} />
            <Campo id="direccion" label="Dirección Postal" as="textarea" rows={3} value={formulario.direccion} onChange={cambiar} error={errores.direccion} />
            <div className="grid grid-cols-2 gap-4">
                <Campo id="ciudad" label="Ciudad" value={formulario.ciudad} onChange={cambiar} />
                <Campo id="codigo_postal" label="C.P." value={formulario.codigo_postal} onChange={cambiar} />
            </div>
        </div>
    );
}
