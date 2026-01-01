import '@/../css/createCliente.css';
import Campo from '@/Components/Campo';
import PrimaryButton from '@/Components/PrimaryButton';
import { useClienteForm } from '@/hooks/useClienteForm';
import { UserIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CreateCliente({ iconOnly = false }) {
    const [abierto, setAbierto] = useState(false);

    const { form, cambiar, errores, enviar, reset } = useClienteForm(
        null,
        () => {
            setAbierto(false);
            reset();
        },
    );

    const handleCerrar = () => {
        setAbierto(false);
        reset();
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
                                value={form.name}
                                onChange={cambiar}
                                error={errores.name}
                                required
                            />
                            <Campo
                                id="email"
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={cambiar}
                                error={errores.email}
                                required
                            />
                        </div>

                        <Campo
                            id="telefono"
                            label="Teléfono"
                            type="tel"
                            value={form.telefono}
                            onChange={cambiar}
                            error={errores.telefono}
                            classNameExtra="font-mono"
                        />

                        <div className="form-grid">
                            <Campo
                                id="tipo_documento"
                                label="Tipo Documento"
                                as="select"
                                value={form.tipo_documento}
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
                                value={form.numero_documento}
                                onChange={cambiar}
                                error={errores.numero_documento}
                                required
                                classNameExtra="font-mono"
                            />
                        </div>

                        <Campo
                            id="nacionalidad"
                            label="Nacionalidad"
                            value={form.nacionalidad}
                            onChange={cambiar}
                            error={errores.nacionalidad}
                        />
                        <Campo
                            id="direccion"
                            label="Dirección"
                            as="textarea"
                            rows={2}
                            value={form.direccion}
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
