import Campo from '@/Components/reservas/utilidades/Campo';
import { TIPOS_HABITACION } from '@/utils/constantes';

export default function CreateHabitacionInfo({ formulario, cambiar, errores }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <Campo id="numero" label="Número de Habitación" value={formulario.numero} onChange={cambiar} error={errores.numero} placeholder="Ej: 101" required claseExtra="font-mono text-lg" />

            <Campo id="tipo" label="Tipo de Habitación" as="select" value={formulario.tipo} onChange={cambiar} error={errores.tipo} required>
                {Object.entries(TIPOS_HABITACION).map(([clave, valor]) => (
                    <option key={clave} value={valor}>{valor.toUpperCase()}</option>
                ))}
            </Campo>

            <Campo id="capacidad" label="Capacidad (Personas)" type="number" min="1" value={formulario.capacidad} onChange={cambiar} error={errores.capacidad} required claseExtra="font-mono" />
        </div>
    );
}
