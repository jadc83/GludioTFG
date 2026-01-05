import '@/../css/createCliente.css';
import PrimaryButton from '@/Components/PrimaryButton';
import useReservaForm from '@/hooks/useReservaForm';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import CreateReservaPaso1 from './CreateReservaPaso1';
import { useState } from 'react';

export default function CreateReserva({
    habitacionesDisponibles = [], iconOnly = false, }) {
    const [isOpen, setIsOpen] = useState(false);

    const {
        pasoActual,
        setPasoActual,
        limpiarRango,
        getValues,
        watch,
        errors
    } = useReservaForm();

    const formulario = watch();

    const resetear = () => {
        setIsOpen(false);
        setPasoActual(1);
        limpiarRango();
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        setPasoActual(2);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Este cambio se maneja a través de React Hook Form's watch()
    };

    return (
        <>
            <PrimaryButton onClick={() => setIsOpen(true)} title="Nueva Reserva" aria-label="Nueva Reserva">
                <CalendarDaysIcon className="h-5 w-5" />
                {!iconOnly && ' Nueva Reserva'}
            </PrimaryButton>

            <dialog className={`drawer-modal ${isOpen ? 'modal-open' : ''}`}>
                <div className={`drawer-panel ${isOpen ? 'abierto' : 'cerrado'} w-full max-w-2xl`}>
                    <header className="drawer-header">
                        <h3 className="drawer-titulo">
                            {pasoActual === 1 ? 'Datos del Cliente' : 'Selección de Habitaciones'}
                            <span className="badge badge-ghost badge-sm ml-2">
                                {pasoActual}/2
                            </span>
                        </h3>
                        <button onClick={resetear} className="btn-cerrar">✕</button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6">
                        {pasoActual === 1 && (
                            <CreateReservaPaso1
                                form={formulario}
                                errores={errors}
                                onChange={handleChange}
                                onNext={handleNextStep}
                            />
                        )}
                    </div>
                </div>
            </dialog>
        </>
    );
}
