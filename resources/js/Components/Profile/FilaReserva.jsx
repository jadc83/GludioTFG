import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function FilaReserva({ reserva, configEstado }) {
    return (
        <tr className="group transition-colors hover:bg-gray-50/50">
            <td className="py-6" data-label="Localizador">
                <div className="flex h-9 w-20 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200 transition-colors group-hover:bg-[#7a0202]">
                    <span className="font-mono text-xs font-black tracking-tighter">
                        {reserva.localizador}
                    </span>
                </div>
            </td>

            <td className="py-6" data-label="Check-In / Out">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-gray-600">
                    <span>{reserva.fecha_entrada}</span>
                    <span className="text-gray-300">→</span>
                    <span>{reserva.fecha_salida}</span>
                </div>
            </td>

            <td
                className="py-6 text-center text-xs font-black text-gray-900"
                data-label="Noches"
            >
                {reserva.noches}
            </td>

            <td
                className="py-6 text-sm font-black italic text-gray-900"
                data-label="Inversión"
            >
                {reserva.monto_total}
            </td>

            <td className="py-6" data-label="Estado">
                <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${configEstado[reserva.estado] || configEstado.default}`}
                >
                    {reserva.estado}
                </span>
            </td>

            <td className="py-6 text-right" data-label="">
                <Link
                    href={`/reservas/${reserva.id}`}
                    aria-label={`Detalles de la reserva ${reserva.localizador}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:text-[#7a0202]"
                >
                    Detalles
                    <ChevronRightIcon className="h-3 w-3" />
                </Link>
            </td>
        </tr>
    );
}
