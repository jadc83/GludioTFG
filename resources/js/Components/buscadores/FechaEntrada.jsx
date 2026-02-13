import CalendarioPicker from '@/Components/reservas/utilidades/CalendarioPicker';
import { ArrowDownOnSquareIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { t } from '@/i18n';
import { formatearFecha } from '../../utils/formatters';

export default function FechaEntrada({
    formularioReserva,
    calendarioAbierto,
    setCalendarioAbierto,
    calendarioRef,
    preciosPorDia,
    componentesDia,
    esMobile,
    formatearISO,
}) {
    return (
        <>
            <div className="hidden items-center gap-1 text-[#7a0202] sm:flex">
                <CalendarIcon className="h-5 w-5" />
            </div>

            {/* INPUT ENTRADA */}
            <div className="relative flex items-center gap-2">
                <label className="whitespace-nowrap text-xs font-semibold text-gray-700">
                    <span className="hidden sm:inline">{t('barra.entrada')}</span>
                    <span className="inline-flex sm:hidden">
                        <ArrowDownOnSquareIcon className="h-5 w-5 text-[#7a0202]" />
                    </span>
                </label>
                <button
                    onClick={() =>
                        setCalendarioAbierto(
                            calendarioAbierto === 'entrada' ? null : 'entrada',
                        )
                    }
                    className="truncate rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner"
                    aria-label={t('barra.aria_entrada')}
                >
                    {formularioReserva.rango?.from
                        ? formatearFecha(formularioReserva.rango.from, 'corta')
                        : '—'}
                </button>
                <CalendarioPicker
                    esMobile={esMobile}
                    calendarioAbierto={calendarioAbierto}
                    handleSeleccionRango={(rango) =>
                        formularioReserva.setRango(rango)
                    }
                    formularioReserva={formularioReserva}
                    preciosPorDia={preciosPorDia}
                    setCalendarioAbierto={setCalendarioAbierto}
                    tipo="entrada"
                    formatearISO={formatearISO}
                    calendarioRef={calendarioRef}
                    components={componentesDia}
                />
            </div>
        </>
    );
}
