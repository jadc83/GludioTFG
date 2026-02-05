import React from 'react';
import Campo from '@/Components/reservas/utilidades/Campo';

export default function FechasPanel({ formulario, cambiar, errores }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <Campo
                id="check_in"
                label="Check-in"
                type="date"
                value={formulario.check_in}
                onChange={cambiar}
                error={errores.check_in}
                required
            />

            <Campo
                id="check_out"
                label="Check-out"
                type="date"
                value={formulario.check_out}
                onChange={cambiar}
                error={errores.check_out}
                required
            />
        </div>
    );
}
