import FilaReserva from './FilaReserva';

export default function TablaReservas({ reservas = [], configEstado = {} }) {
    return (
        <div className="overflow-hidden rounded-xl">
            <table className="w-full table-auto text-left">
                <caption className="sr-only">Tabla de reservas</caption>
                <thead className="bg-white/80 text-[10px] uppercase tracking-widest text-gray-500">
                    <tr>
                        <th scope="col" className="p-4">Localizador</th>
                        <th scope="col" className="p-4">Check-In / Out</th>
                        <th scope="col" className="p-4">Noches</th>
                        <th scope="col" className="p-4">Inversión</th>
                        <th scope="col" className="p-4">Estado</th>
                        <th scope="col" className="p-4" />
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {reservas.map((r) => (
                        <FilaReserva key={r.id} reserva={r} configEstado={configEstado} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
