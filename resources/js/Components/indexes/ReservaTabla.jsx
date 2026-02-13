import ReservaFila from './ReservaFila';

export default function ReservaTabla({ reservasPaginadas, eliminandoId, eliminarReserva, toggleSortByCreatedAt, filtros }) {
    return (
        <div className="overflow-x-auto">
            <table className="responsive-table w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Localizador</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cliente</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Habitación</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Llegada</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Salida</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Precio</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado Pago</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado Reserva</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {reservasPaginadas.map((reserva) => (
                        <ReservaFila key={reserva.id} reserva={reserva} eliminandoId={eliminandoId} eliminarReserva={eliminarReserva} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
