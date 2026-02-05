import React from 'react';
import Campo from '@/Components/reservas/utilidades/Campo';
import BusquedaClientes from '@/Components/buscadores/BusquedaClientes';

export default function ClientePanel({ formulario, cambiar, errores, clienteSeleccionado, onSeleccionarCliente }) {
    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <BusquedaClientes
                onSeleccionar={onSeleccionarCliente}
                clienteSeleccionado={clienteSeleccionado}
            />

            <div className="grid grid-cols-2 gap-4">
                <Campo
                    id="nombre_cliente"
                    label="Nombre Completo"
                    value={formulario.nombre_cliente}
                    onChange={cambiar}
                    error={errores.nombre_cliente}
                    required
                />
                <Campo
                    id="email_cliente"
                    label="Email"
                    type="email"
                    value={formulario.email_cliente}
                    onChange={cambiar}
                    error={errores.email_cliente}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Campo
                    id="telefono_cliente"
                    label="Teléfono"
                    type="tel"
                    value={formulario.telefono_cliente}
                    onChange={cambiar}
                    error={errores.telefono_cliente}
                    required
                />
                <Campo
                    id="tipo_documento"
                    label="Tipo de Documento"
                    as="select"
                    value={formulario.tipo_documento}
                    onChange={cambiar}
                    error={errores.tipo_documento}
                    required
                >
                    {Object.entries({ dni: 'dni', pasaporte: 'pasaporte', tie: 'tie' }).map(([clave, valor]) => (
                        <option key={clave} value={valor}>
                            {valor.toUpperCase()}
                        </option>
                    ))}
                </Campo>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Campo
                    id="numero_documento"
                    label="Número de Documento"
                    value={formulario.numero_documento}
                    onChange={cambiar}
                    error={errores.numero_documento}
                    required
                />
                <Campo
                    id="nacionalidad"
                    label="Nacionalidad"
                    value={formulario.nacionalidad}
                    onChange={cambiar}
                    error={errores.nacionalidad}
                    required
                />
            </div>

            <Campo
                id="direccion"
                label="Dirección"
                value={formulario.direccion}
                onChange={cambiar}
                error={errores.direccion}
                required
            />
        </div>
    );
}
