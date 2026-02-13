import useBuscadorReserva from '@/hooks/reservas/useBuscadorReserva';
import BuscadorForm from './BuscadorForm';
import ReservaDetails from './ReservaDetails';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function BuscadorReserva() {
    const {
        localizador,
        setLocalizador,
        buscando,
        reserva,
        error,
        handleBuscar,
        getStatusBadge,
        getPagoBadge,
    } = useBuscadorReserva();

    return (
        <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                    <h2 className="mb-2 text-3xl font-bold text-gray-800">Busca tu Reserva</h2>
                    <p className="text-gray-600">Ingresa tu número de localizador para ver los detalles</p>
                </div>

                <BuscadorForm localizador={localizador} setLocalizador={setLocalizador} buscando={buscando} handleBuscar={handleBuscar} />

                {error && (
                    <div className="alert alert-error mb-6 shadow-lg">
                        <InformationCircleIcon className="h-6 w-6" />
                        <span>{error}</span>
                    </div>
                )}

                {reserva && (
                    <ReservaDetails reserva={reserva} getStatusBadge={getStatusBadge} getPagoBadge={getPagoBadge} />
                )}
            </div>
        </div>
    );
}
