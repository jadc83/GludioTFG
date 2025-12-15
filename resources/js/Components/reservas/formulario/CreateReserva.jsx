import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import useReservaForm from '@/hooks/useReservaForm';
import CreateReservaPaso1 from './CreateReservaPaso1';
import CreateReservaPaso2 from './CreateReservaPaso2';
import '@/../css/createCliente.css';

export default function CreateReserva({ habitacionesDisponibles = [], onSuccess, iconOnly = false }) {
    const { isOpen, setIsOpen, step, paso1Props, paso2Props, resetear } = useReservaForm(habitacionesDisponibles, onSuccess);

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

                    <div className="flex-1 overflow-y-auto">
                        {step === 1 && <CreateReservaPaso1 {...paso1Props} />}
                        {step === 2 && <CreateReservaPaso2 {...paso2Props} />}
                    </div>
                </div>
            </dialog>
        </>
    );
}
