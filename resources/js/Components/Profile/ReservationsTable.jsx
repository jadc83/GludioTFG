import ReservationRow from './ReservationRow';

export default function ReservationsTable({ reservas = [], configEstado = {} }) {
    return (
        <div className="overflow-hidden rounded-xl">
            <table className="w-full table-auto text-left">
                <thead className="bg-white/80 text-[10px] uppercase tracking-widest text-gray-500">
                    <tr>
                        <th className="p-4">Localizador</th>
                        <th className="p-4">Check-In / Out</th>
                        <th className="p-4">Noches</th>
                        <th className="p-4">Inversión</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4" />
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {reservas.map((r) => (
                        <ReservationRow key={r.id} reserva={r} configEstado={configEstado} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
