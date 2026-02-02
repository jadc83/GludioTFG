import PrimaryButton from '@/Components/UI/PrimaryButton';
import { es } from 'date-fns/locale';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { obtenerDiaDelaSemana } from '../../utils/formatters';

const CalendarioStyles = () => (
    <style>{`.rdp { --rdp-cell_size: 2.5rem; --rdp-accent_color: #7a0202; --rdp-background_color: #fef2f2; } .rdp-caption { font-weight: 600; color: #1f2937; padding-bottom: 1rem; } .rdp-head_cell { font-weight: 600; color: #6b7280; font-size: 0.875rem; } .rdp-cell { position: relative; } .rdp-day_selected { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day_range_middle { background-color: #fee2e2 !important; color: #1f2937; } .rdp-day_range_start, .rdp-day_range_end { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day_today { font-weight: 700; color: #7a0202; }`}</style>
);

const BotonesCalendario = ({
    formularioReserva,
    setCalendarioAbierto,
    esMobile = false,
    formatearISO,
    preciosPorDia,
}) => {
    const rangoInicio = formularioReserva.rango?.from;
    const rangoFin = formularioReserva.rango?.to;
    const mismoDia =
        rangoInicio &&
        rangoFin &&
        formatearISO &&
        formatearISO(rangoInicio) === formatearISO(rangoFin);

    // Verificar si hay días con 100% ocupación en el rango
    const tieneDiasCompletos = (() => {
        if (!rangoInicio || !rangoFin || !preciosPorDia) return false;
        const start = new Date(rangoInicio);
        const end = new Date(rangoFin);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const iso = formatearISO(d);
            const info = preciosPorDia[iso];
            if (info?.ocupacion === 100) return true;
        }
        return false;
    })();

    const deshabilitarContinuar =
        !rangoInicio || !rangoFin || mismoDia || tieneDiasCompletos;

    return (
        <div
            className={`flex items-center justify-between gap-2 ${!esMobile ? 'rounded-b-xl border-t border-gray-200 bg-gray-50 px-6 py-4' : 'mt-4 border-t border-gray-200 pt-4'}`}
        >
            <button
                onClick={() => {
                    formularioReserva.limpiarRango();
                }}
                className={`btn btn-outline btn-sm ${esMobile ? 'flex-1' : ''}`}
            >
                Limpiar
            </button>
            <PrimaryButton
                className={`${esMobile ? 'flex-1 px-3 py-1 text-xs' : 'px-3 py-1 text-xs'}`}
                disabled={deshabilitarContinuar}
                onClick={() => {
                    setCalendarioAbierto(null);
                    if (formularioReserva.pasoActual === 1)
                        formularioReserva.avanzarPaso();
                }}
            >
                Continuar
            </PrimaryButton>
        </div>
    );
};

function CalendarioPicker({
    esMobile,
    calendarioAbierto,
    handleSeleccionRango,
    formularioReserva,
    preciosPorDia,
    setCalendarioAbierto,
    tipo,
    formatearISO,
    calendarioRef,
    components,
}) {
    const innerRef = calendarioRef || useRef(null);
    const [visibleMonth, setVisibleMonth] = useState(() => {
        try {
            return formularioReserva?.rango?.from
                ? new Date(formularioReserva.rango.from)
                : new Date();
        } catch (e) {
            return new Date();
        }
    });

    useEffect(() => {
        if (calendarioAbierto && formularioReserva?.rango?.from) {
            setVisibleMonth(new Date(formularioReserva.rango.from));
        }
    }, [calendarioAbierto, formularioReserva]);

    const handleInternalMonthChange = (monthDate) => {
        if (!monthDate) return;
        setVisibleMonth(monthDate);
        // Prefetch de meses movido al backend; cliente no dispara carga adicional aquí.
    };

    const isDayDisabled = (date) => {
        // Deshabilitar días anteriores a hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return true;

        // Deshabilitar días con 100% de ocupación
        if (preciosPorDia && formatearISO) {
            const iso = formatearISO(date);
            const info = preciosPorDia[iso];
            if (info?.ocupacion === 100) return true;
        }

        return false;
    };

    const CalendarioDesktop = () => (
        <div
            ref={innerRef}
            className="calendar-pos-1366 fixed left-1/2 z-50 mx-4 w-full max-w-[40rem] -translate-x-1/2 rounded-xl bg-white p-0 shadow-2xl"
            data-calendario
        >
            <div className="w-full bg-gradient-to-br from-white to-gray-50 p-6">
                <DayPicker
                    mode="range"
                    selected={formularioReserva.rango}
                    onSelect={handleSeleccionRango}
                    onMonthChange={handleInternalMonthChange}
                    month={visibleMonth}
                    locale={es}
                    disabled={isDayDisabled}
                    numberOfMonths={1}
                    formatters={{
                        formatWeekdayName: (date) => obtenerDiaDelaSemana(date),
                    }}
                    components={components}
                />
            </div>
            <BotonesCalendario
                formularioReserva={formularioReserva}
                setCalendarioAbierto={setCalendarioAbierto}
                formatearISO={formatearISO}
                esMobile={esMobile}
                preciosPorDia={preciosPorDia}
            />
        </div>
    );

    const CalendarioMobile = () => (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50"
            onClick={() => setCalendarioAbierto(null)}
        >
            <div
                className="mx-4 flex max-h-[85vh] w-full max-w-sm flex-col rounded-xl bg-white px-4 py-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
                    Selecciona {tipo === 'entrada' ? 'entrada' : 'salida'}
                </h3>
                <div className="flex-1">
                    <DayPicker
                        mode="range"
                        selected={formularioReserva.rango}
                        onSelect={handleSeleccionRango}
                        onMonthChange={handleInternalMonthChange}
                        month={visibleMonth}
                        locale={es}
                        disabled={isDayDisabled}
                        numberOfMonths={1}
                        formatters={{
                            formatWeekdayName: (date) =>
                                obtenerDiaDelaSemana(date).substring(0, 3),
                        }}
                        components={components}
                    />
                </div>
                <BotonesCalendario
                    formularioReserva={formularioReserva}
                    setCalendarioAbierto={setCalendarioAbierto}
                    formatearISO={formatearISO}
                    esMobile={esMobile}
                    preciosPorDia={preciosPorDia}
                />
            </div>
        </div>
    );

    if (calendarioAbierto === tipo) {
        return esMobile ? <CalendarioMobile /> : <CalendarioDesktop />;
    }
    return null;
}

CalendarioPicker.propTypes = {
    esMobile: PropTypes.bool,
    calendarioAbierto: PropTypes.string,
    handleSeleccionRango: PropTypes.func,
    formularioReserva: PropTypes.object,
    preciosPorDia: PropTypes.object,
    setCalendarioAbierto: PropTypes.func,
    tipo: PropTypes.string,
    formatearISO: PropTypes.func,
    calendarioRef: PropTypes.object,
    onMonthChange: PropTypes.func,
};

export default CalendarioPicker;

export { CalendarioStyles };
