import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import useReservaForm from '@/hooks/useReservaForm';
import CreateReservaPaso1 from './CreateReservaPaso1';
import '@/../css/createCliente.css';

export default function CreateReserva({ habitacionesDisponibles = [], onSuccess, iconOnly = false }) {
    const [modoContinuo, setModoContinuo] = useState(false);

    const onCreated = () => {

        if (!modoContinuo) {
            resetear();
        } else {
            limpiar();
        }
    };

    const { isOpen, setIsOpen, step, paso1Props, resetear, limpiar } = useReservaForm(habitacionesDisponibles, onCreated);

    return (
        <>
            <PrimaryButton onClick={() => setIsOpen(true)} title="Nueva Reserva" aria-label="Nueva Reserva">
                <CalendarDaysIcon className="w-5 h-5" />
                {!iconOnly && ' Nueva Reserva'}
            </PrimaryButton>

            <dialog className={`drawer-modal ${isOpen ? 'modal-open' : ''}`}>
                <div className={`drawer-panel ${isOpen ? 'abierto' : 'cerrado'} w-full max-w-2xl`}>
                    <header className="drawer-header">
                        <h3 className="drawer-titulo">
                            {step === 1 ? 'Datos del Cliente' : 'Selección de Habitaciones'}
                            <span className="badge badge-sm badge-ghost ml-2">{step}/2</span>
                        </h3>
                        <button onClick={resetear} className="btn-cerrar">
                            ✕
                        </button>
                    </header>

                    <div className="px-6">
                        <div className="form-control my-4">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={modoContinuo}
                                    onChange={e => setModoContinuo(e.target.checked)} />
                                <span className="label-text">Creación rápida</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6">
                        {step === 1 && <CreateReservaPaso1 {...paso1Props} />}
                    </div>
                </div>
            </dialog>
        </>
    );
}
