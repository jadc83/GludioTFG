import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function CreateReservaPaso2({ habitaciones, formHabitaciones, guardando, onBack, onSubmit }) {
    const { seleccionadas, toggleHabitacion, esValido, textoResumen } = formHabitaciones;

    const handleSubmit = async () => {
        console.log('SUBMIT EJECUTADO');
        if (onSubmit) {
            await onSubmit();
        }
        console.log('SUBMIT TERMINADO');
    };

    const renderHabitacion = (habitacion) => {
        const isSelected = seleccionadas.includes(habitacion.id);
        const clases = `flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`;

        return (
            <label key={habitacion.id} className={clases}>
                <Checkbox checked={isSelected} onChange={() => toggleHabitacion(habitacion.id)} />
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800">
                        Hab. {habitacion.numero}
                        <span className="text-xs font-normal opacity-70 ml-2">({habitacion.tipo})</span>
                    </div>
                    <div className="text-sm text-gray-600">Capacidad: {habitacion.capacidad} pax</div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-lg text-primary font-mono">€{habitacion.precio_noche}</div>
                    <div className="text-xs text-gray-500">por noche</div>
                </div>
            </label>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 flex-1 overflow-y-auto space-y-3">
                {habitaciones.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        No hay habitaciones disponibles para estas fechas.
                    </div>
                ) : (
                    habitaciones.map(renderHabitacion)
                )}
            </div>

            <div className="border-t bg-base-100 p-4 space-y-3">
                {seleccionadas.length > 0 && (
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <div className="text-sm text-gray-600">Resumen</div>
                        <div className="text-lg font-bold text-primary">{textoResumen}</div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button type="button" onClick={onBack} className="btn btn-outline flex-1" disabled={guardando}>
                        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Atrás
                    </button>

                    <PrimaryButton onClick={handleSubmit} className="flex-1 justify-center" disabled={!esValido || guardando}>
                        {guardando ? (
                            <>
                                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mr-3 inline-block" />
                                <span className="font-semibold text-base">Guardando...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-6 h-6 mr-3" />
                                <span className="font-semibold text-base">Confirmar Reserva ({seleccionadas.length})</span>
                            </>
                        )}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
