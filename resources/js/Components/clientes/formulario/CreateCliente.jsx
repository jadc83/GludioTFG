import '@/../css/createCliente.css';
import Campo from '@/Components/Campo';
import PrimaryButton from '@/Components/PrimaryButton';
import { useClienteForm } from '@/hooks/useClienteForm';
import { UserIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CreateCliente({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);

    const { formulario, cambiar, errores, enviar, limpiar } = useClienteForm(
        null,
        () => {
            setAbierto(false);
            limpiar();
        },
    );

    const handleCerrar = () => {
        setAbierto(false);
        limpiar();
    };

    return (
        <>
            <PrimaryButton
                onClick={() => setAbierto(true)}
                title="Nuevo Cliente"
                aria-label="Nuevo Cliente"
            >
                <UserIcon className="h-5 w-5" />
                {!iconOnly && ' Nuevo Cliente'}
            </PrimaryButton>

            <dialog className={`drawer-modal ${abierto ? 'modal-open' : ''}`}>
                <div
                    className={`drawer-panel ${abierto ? 'abierto' : 'cerrado'}`}
                >
                    <header className="drawer-header">
                        <h3 className="drawer-titulo">Alta de Cliente</h3>
                        <button onClick={handleCerrar} className="btn-cerrar">
                            ✕
                        </button>
                    </header>

                    <form onSubmit={enviar} className="form-cliente">
                        <div className="form-grid">
                            <Campo
                                id="name"
                                label="Nombre Completo"
                                value={formulario.name}
                                onChange={cambiar}
                                error={errores.name}
                                required
                            />
                            <Campo
                                id="email"
                                label="Email"
                                type="email"
                                value={formulario.email}
                                onChange={cambiar}
                                error={errores.email}
                                required
                            />
                        </div>

                        <Campo
                            id="telefono"
                            label="Teléfono"
                            type="tel"
                            value={formulario.telefono}
                            onChange={cambiar}
                            error={errores.telefono}
                            classNameExtra="font-mono"
                        />

                        <div className="form-grid">
                            <Campo
                                id="tipo_documento"
                                label="Tipo Documento"
                                as="select"
                                value={formulario.tipo_documento}
                                onChange={cambiar}
                                error={errores.tipo_documento}
                                required
                            >
                                <option value="dni">DNI</option>
                                <option value="pasaporte">Pasaporte</option>
                                <option value="tie">TIE</option>
                            </Campo>
                            <Campo
                                id="numero_documento"
                                label="Número Documento"
                                value={formulario.numero_documento}
                                onChange={cambiar}
                                error={errores.numero_documento}
                                required
                                classNameExtra="font-mono"
                            />
                        </div>

                        <Campo
                            id="nacionalidad"
                            label="Nacionalidad"
                            value={formulario.nacionalidad}
                            onChange={cambiar}
                            error={errores.nacionalidad}
                        />
                        <Campo
                            id="direccion"
                            label="Dirección"
                            as="textarea"
                            rows={2}
                            value={formulario.direccion}
                            onChange={cambiar}
                            error={errores.direccion}
                        />

                        <PrimaryButton type="submit" className="mt-4 w-full">
                            Guardar Cliente
                        </PrimaryButton>
                    </form>
                </div>
            </dialog>
        </>
    );
}
