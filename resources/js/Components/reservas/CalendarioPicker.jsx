import React, { useRef, useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { obtenerDiaDelaSemana } from '../../utils/formatters';
import PrimaryButton from '../PrimaryButton';
import PropTypes from 'prop-types';

const CalendarioStyles = () => (
  <style>{`.rdp { --rdp-cell_size: 2.5rem; --rdp-accent_color: #7a0202; --rdp-background_color: #fef2f2; } .rdp-caption { font-weight: 600; color: #1f2937; padding-bottom: 1rem; } .rdp-head_cell { font-weight: 600; color: #6b7280; font-size: 0.875rem; } .rdp-cell { position: relative; } .rdp-day_selected { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day_range_middle { background-color: #fee2e2 !important; color: #1f2937; } .rdp-day_range_start, .rdp-day_range_end { background: linear-gradient(135deg, #7a0202 0%, #920303 100%); font-weight: 600; } .rdp-day_today { font-weight: 700; color: #7a0202; }`}</style>
);

const BotonesCalendario = ({ formularioReserva, setCalendarioAbierto, esMobile = false, formatearISO }) => {
  const rangoInicio = formularioReserva.rango?.from;
  const rangoFin = formularioReserva.rango?.to;
  const mismoDia = rangoInicio && rangoFin && formatearISO && formatearISO(rangoInicio) === formatearISO(rangoFin);
  const deshabilitarContinuar = !rangoInicio || !rangoFin || mismoDia;

  return (
    <div className={`flex items-center justify-between gap-2 ${!esMobile ? 'px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl' : 'mt-4 pt-4 border-t border-gray-200'}`}>
      <button onClick={() => { formularioReserva.limpiarRango(); setCalendarioAbierto(null); }} className={`btn btn-sm btn-outline ${esMobile ? 'flex-1' : ''}`}>
        Limpiar
      </button>
      <PrimaryButton className={`${esMobile ? 'flex-1 py-1 px-3 text-xs' : 'py-1 px-3 text-xs'}`} disabled={deshabilitarContinuar}
        onClick={() => { setCalendarioAbierto(null); if (formularioReserva.pasoActual === 1) formularioReserva.avanzarPaso(); }}>
        Continuar
      </PrimaryButton>
    </div>
  );
};

function CalendarioPicker({ esMobile, calendarioAbierto, handleSeleccionRango, formularioReserva, preciosPorDia, setCalendarioAbierto, tipo, formatearISO, calendarioRef, components }) {
  const innerRef = calendarioRef || useRef(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    try {
      return formularioReserva?.rango?.from ? new Date(formularioReserva.rango.from) : new Date();
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

  const CalendarioDesktop = () => (
    <div ref={innerRef} className="fixed bg-white rounded-xl shadow-2xl p-0 w-full max-w-[40rem] mx-4 z-50 left-1/2 -translate-x-1/2 calendar-pos-1366" data-calendario>
      <div className="w-full p-6 bg-gradient-to-br from-white to-gray-50">
          <DayPicker mode="range" selected={formularioReserva.rango} onSelect={handleSeleccionRango} onMonthChange={handleInternalMonthChange}
          month={visibleMonth} locale={es} disabled={{ before: new Date() }} numberOfMonths= {1} formatters={{ formatWeekdayName: (date) => obtenerDiaDelaSemana(date) }}
          components={components}/>
      </div>
      <BotonesCalendario formularioReserva={formularioReserva} setCalendarioAbierto={setCalendarioAbierto} formatearISO={formatearISO} esMobile={esMobile} />
    </div>
  );

  const CalendarioMobile = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center" onClick={() => setCalendarioAbierto(null)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 px-4 py-6 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Selecciona {tipo === 'entrada' ? 'entrada' : 'salida'}</h3>
        <div className="flex-1">
          <DayPicker mode="range" selected={formularioReserva.rango} onSelect={handleSeleccionRango} onMonthChange={handleInternalMonthChange} month={visibleMonth} locale={es} disabled={{ before: new Date() }}
            numberOfMonths={1} formatters={{ formatWeekdayName: (date) => obtenerDiaDelaSemana(date).substring(0, 3) }}
            components={components}
          />
        </div>
        <BotonesCalendario formularioReserva={formularioReserva} setCalendarioAbierto={setCalendarioAbierto} formatearISO={formatearISO} esMobile={esMobile} />
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
