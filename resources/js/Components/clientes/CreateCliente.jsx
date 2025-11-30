import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import Campo from '@/Components/Campo';
import { useClienteForm } from '../../hooks/useClienteForm';
import '@/../css/createCliente.css';

export default function CreateCliente() {
    const [abierto, setAbierto] = useState(false);
    const [modoContinuo, setModoContinuo] = useState(false);

    const { form, cambiar, errores, guardando, enviar, reset } = useClienteForm(
        null,
        () => {
            if (!modoContinuo) {
                setAbierto(false);
            } else {
                reset();
            }
        }
    );

    const handleCerrar = () => {
        setAbierto(false);
        reset();
    };

    return (
        <>
            <PrimaryButton onClick={() => setAbierto(true)}>
                <PlusIcon className="w-5 h-5" />
                Nuevo Cliente
            </PrimaryButton>

            <dialog className={`drawer-modal ${abierto ? 'modal-open' : ''}`}>
                <div className={`drawer-panel ${abierto ? 'abierto' : 'cerrado'}`}>
                    <header className="drawer-header">
                        <h3 className="drawer-titulo">Alta de Cliente</h3>
                        <button onClick={handleCerrar} className="btn-cerrar">✕</button>
                    </header>

                    <form onSubmit={enviar} className="form-cliente">
                        <div className="form-control rounded-box">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input type="checkbox" className="checkbox checkbox-primary checkbox-lg" checked={modoContinuo}
                                    onChange={e => setModoContinuo(e.target.checked)}/>
                                <span className="label-text font-medium">Creación rápida</span>
                            </label>
                        </div>

                        <div className="form-grid">
                            <Campo id="name" label="Nombre Completo" value={form.name} onChange={cambiar} error={errores.name} required />
                            <Campo id="email" label="Email" type="email" value={form.email} onChange={cambiar} error={errores.email} required />
                        </div>

                        <Campo id="telefono" label="Teléfono" type="tel" value={form.telefono} onChange={cambiar} error={errores.telefono} />

                        <div className="form-grid">
                            <Campo id="tipo_documento" label="Tipo Documento" as="select" value={form.tipo_documento} onChange={cambiar} error={errores.tipo_documento} required>
                                <option value="dni">DNI</option>
                                <option value="pasaporte">Pasaporte</option>
                                <option value="tie">TIE</option>
                            </Campo>
                            <Campo id="numero_documento" label="Número Documento" value={form.numero_documento} onChange={cambiar} error={errores.numero_documento} required />
                        </div>

                        <Campo id="nacionalidad" label="Nacionalidad" value={form.nacionalidad} onChange={cambiar} error={errores.nacionalidad} />
                        <Campo id="direccion" label="Dirección" as="textarea" rows={2} value={form.direccion} onChange={cambiar} error={errores.direccion} />

                        <PrimaryButton type="submit" className="w-full mt-4">
                            {guardando ? 'Guardando...' : 'Crear Cliente'}
                        </PrimaryButton>
                    </form>
                </div>
            </dialog>
        </>
    );
}
