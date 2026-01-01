import '@/../css/createCliente.css';
import PrimaryButton from '@/Components/PrimaryButton';
import useReservaForm from '@/hooks/useReservaForm';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import CreateReservaPaso1 from './CreateReservaPaso1';

export default function CreateReserva({
    habitacionesDisponibles = [],
    iconOnly = false,
}) {
    const onCreated = () => {
        resetear();
    };

    const { isOpen, setIsOpen, step, paso1Props, resetear } = useReservaForm(
        habitacionesDisponibles,
        onCreated,
    );

    return (
        <>
            <PrimaryButton
                onClick={() => setIsOpen(true)}
                title="Nueva Reserva"
                aria-label="Nueva Reserva"
            >
                <CalendarDaysIcon className="h-5 w-5" />
                {!iconOnly && ' Nueva Reserva'}
            </PrimaryButton>

            <dialog className={`drawer-modal ${isOpen ? 'modal-open' : ''}`}>
                <div
                    className={`drawer-panel ${isOpen ? 'abierto' : 'cerrado'} w-full max-w-2xl`}
                >
                    <header className="drawer-header">
                        <h3 className="drawer-titulo">
                            {step === 1
                                ? 'Datos del Cliente'
                                : 'Selección de Habitaciones'}
                            <span className="badge badge-ghost badge-sm ml-2">
                                {step}/2
                            </span>
                        </h3>
                        <button onClick={resetear} className="btn-cerrar">
                            ✕
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6">
                        {step === 1 && <CreateReservaPaso1 {...paso1Props} />}
                    </div>
                </div>
            </dialog>
        </>
    );
}
