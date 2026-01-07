import '@/../css/createCliente.css';
import Campo from '@/Components/Campo';
import PrimaryButton from '@/Components/PrimaryButton';
import { useClienteForm } from '@/hooks/useClienteForm';
import { TIPOS_DOCUMENTO } from '@/utils/constantes';

export default function EditCliente({ cliente, abierto, onCerrar }) {
    const { formulario, cambiar, errores, estaCargando, enviar } = useClienteForm(
        cliente,
        onCerrar,
    );

    return (
        <dialog className={`drawer-modal ${abierto ? 'modal-open' : ''}`}>
            <div className={`drawer-panel ${abierto ? 'abierto' : 'cerrado'}`}>
                <header className="drawer-header">
                    <h3 className="drawer-titulo">
                        {cliente
                            ? `Editar Cliente: ${cliente.name}`
                            : 'Editar Cliente'}
                    </h3>
                    <button onClick={onCerrar} className="btn-cerrar">
                        ✕
                    </button>
                </header>

                {cliente && (
                    <form onSubmit={enviar} className="form-cliente">
                        <div className="form-grid">
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
                        </div>

                        <Campo
                            id="telefono"
                            label="Teléfono"
                            type="tel"
                            value={formulario.telefono || ''}
                            onChange={cambiar}
                            error={errores.telefono}
                            classNameExtra="font-mono"
                        />

                        <div className="form-grid">
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
                                {Object.entries(TIPOS_DOCUMENTO).map(([clave, valor]) => (
                                    <option key={clave} value={valor}>
                                        {valor.charAt(0).toUpperCase() + valor.slice(1)}
                                    </option>
                                ))}
                            </Campo>
                            <Campo
                                id="numero_documento"
                                label="Número Documento"
                                value={formulario.numero_documento || ''}
                                onChange={cambiar}
                                error={errores.numero_documento}
                                required
                                classNameExtra="font-mono"
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
                            id="direccion"
                            label="Dirección"
                            as="textarea"
                            rows={3}
                            value={formulario.direccion || ''}
                            onChange={cambiar}
                            error={errores.direccion}
                        />

                        <PrimaryButton type="submit" className="mt-4 w-full">
                            {estaCargando
                                ? 'Actualizando...'
                                : 'Actualizar Cliente'}
                        </PrimaryButton>
                    </form>
                )}
            </div>
        </dialog>
    );
}
