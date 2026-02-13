import CalendarioPicker, { CalendarioStyles } from '@/Components/reservas/utilidades/CalendarioPicker';
import { ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
import { t } from '@/i18n';
import { formatearFecha } from '../../utils/formatters';

export default function FechaSalida({
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
        <div className="relative flex items-center gap-2">
            <label className="whitespace-nowrap text-xs font-semibold text-gray-700">
                <span className="hidden sm:inline">{t('barra.salida')}</span>
                <span className="inline-flex sm:hidden">
                    <ArrowUpOnSquareIcon className="h-5 w-5 text-gray-700" />
                </span>
            </label>
            <button
                onClick={() =>
                    setCalendarioAbierto(
                        calendarioAbierto === 'salida' ? null : 'salida',
                    )
                }
                disabled={!formularioReserva.rango?.from}
                className="truncate rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('barra.aria_salida')}
            >
                {formularioReserva.rango?.to
                    ? formatearFecha(formularioReserva.rango.to, 'corta')
                    : '—'}
            </button>
            <CalendarioStyles />
            {formularioReserva.rango?.from && (
                <CalendarioPicker
                    esMobile={esMobile}
                    calendarioAbierto={calendarioAbierto}
                    handleSeleccionRango={(rango) =>
                        formularioReserva.setRango(rango)
                    }
                    formularioReserva={formularioReserva}
                    preciosPorDia={preciosPorDia}
                    setCalendarioAbierto={setCalendarioAbierto}
                    tipo="salida"
                    formatearISO={formatearISO}
                    calendarioRef={calendarioRef}
                    components={componentesDia}
                />
            )}
        </div>
    );
}
