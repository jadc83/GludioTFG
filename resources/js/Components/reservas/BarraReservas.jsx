import useReservaForm from '../../hooks/useReservaForm';
import Paso2Habitaciones from './pasos/Paso2Habitaciones';
import Paso3Datos from './pasos/Paso3Datos';
import Paso4Confirmacion from './pasos/Paso4Confirmacion';
import TypingAnimation from '../TypingAnimation';
import BuscadorNavbar from '../BuscadorNavbar';
import { formatearFecha, calcularNoches } from '../../utils/formatters';
import '../../../css/createHabitacion.css';
import '../../../css/estiloCalendario.css';
import '../../../css/estiloMenuLateral.css';
import React, { useState, useEffect, useRef, useCallback, useMemo, isValidElement, cloneElement } from 'react';
import useCalendarioPrecios from '../../hooks/useCalendarioPrecios';
import { usePage } from '@inertiajs/react';
import { CalendarIcon } from '@heroicons/react/24/outline';

import CalendarioPicker, { CalendarioStyles } from './CalendarioPicker';

// Componente Modal reutilizable
const ModalPaso = ({ paso, pasoActual, onClose, children, maxWidth = 'max-w-sm' }) => {
  if (pasoActual !== paso) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-${paso === 2 ? 'center' : 'start'} justify-center p-2 ${paso === 2 ? 'md:pt-[150px] md:items-start' : 'pt-[40px] md:pt-[60px]'}`} onClick={onClose}>
      <div className={`bg-${paso === 3 ? 'gris' : 'white'} rounded-lg ${maxWidth} md:max-w-4xl w-full max-h-[90vh] overflow-y-auto ${paso === 3 ? 'p-6' : ''}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default function BarraReservas() {
  const formularioReserva = useReservaForm();
  const pagina = usePage();
  const esPanelControl = pagina.url?.includes('panel') || pagina.component === 'PanelControl';
  const [calendarioAbierto, setCalendarioAbierto] = useState(null);
  const { preciosPorDia, consultaPrecios, formatearISO, esMobile } = useCalendarioPrecios();
  const calendarioRef = useRef(null);

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    if (!calendarioAbierto) return;

    const handleClickOutside = (event) => {
      if (calendarioRef.current && !calendarioRef.current.contains(event.target)) {
        setCalendarioAbierto(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarioAbierto]);

  // Escuchar evento para abrir calendario desde Paso2
  useEffect(() => {
    const handler = (event) => setCalendarioAbierto(event.detail);
    window.addEventListener('abrirCalendario', handler);
    return () => window.removeEventListener('abrirCalendario', handler);
  }, []);
  // Cargar precios cuando se abre el calendario
  useEffect(() => {
    if (!calendarioAbierto) return;
    const inicio = new Date();
    const fin = new Date();
    fin.setDate(fin.getDate() + 365);
    const start = formatearISO(inicio);
    const end = formatearISO(fin);
    consultaPrecios(start, end);
  }, [calendarioAbierto, consultaPrecios, formatearISO]);

  // Memoize precios map to avoid unnecessary recalculations in Day render
  const mapaPrecios = useMemo(() => preciosPorDia || {}, [preciosPorDia]);

  // NOTE: Prefetch por mes movido al backend; el frontend solo solicita rangos completos cuando es necesario.

  const noches = formularioReserva.rango?.from && formularioReserva.rango?.to ? calcularNoches(formularioReserva.rango.from, formularioReserva.rango.to) : 0;

  const componentesDia = useMemo(() => ({
    Day: ({ date, disabled, ...props }) => {
      const iso = props?.day?.isoDate || (date ? formatearISO(date) : null);
      const precio = iso ? mapaPrecios[iso] : undefined;

      // Determinar explícitamente si la fecha es anterior a hoy (ignorando horas).
      let isBeforeToday = false;
      try {
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
          const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const today = new Date();
          const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          isBeforeToday = dayDate < t;
        }
      } catch (e) {
        isBeforeToday = false;
      }

      const atributoPrecio = !isBeforeToday && !disabled && precio ? `€${precio}` : '';

      // Si el hijo es un elemento React (el botón del día), clonar para inyectar el precio
      let contenido = props.children;
      if (atributoPrecio && React.isValidElement(contenido)) {
        const hijosOriginales = contenido.props.children;
        contenido = cloneElement(contenido, {}, [
          hijosOriginales,
          <span
            key="precio"
            className="rdp-day_price"
            style={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
          >
            {atributoPrecio}
          </span>,
        ]);
      }

      return (
        <td className={props.className}>
          {contenido}
        </td>
      );
    }
  }), [mapaPrecios, formatearISO]);

  return (
    <>
      {/* MODALES */}
      <ModalPaso paso={2} pasoActual={formularioReserva.pasoActual} onClose={() => formularioReserva.retrocederPaso()} maxWidth="max-w-sm">
        <Paso2Habitaciones {...formularioReserva} />
      </ModalPaso>

      <ModalPaso paso={3} pasoActual={formularioReserva.pasoActual} onClose={() => formularioReserva.retrocederPaso()} maxWidth="max-w-2xl">
        <Paso3Datos {...formularioReserva} />
      </ModalPaso>

      <ModalPaso paso={4} pasoActual={formularioReserva.pasoActual} onClose={() => formularioReserva.retrocederPaso()} maxWidth="max-w-sm">
        <Paso4Confirmacion {...formularioReserva} usuarioActual={formularioReserva.usuarioActual} getValues={formularioReserva.getValues} idClienteSeleccionado={formularioReserva.idClienteSeleccionado} tipoClienteSeleccionado={formularioReserva.tipoClienteSeleccionado} habitacionesDisponibles={formularioReserva.habitacionesDisponibles} />
      </ModalPaso>

      {/* BARRA STICKY */}
      {!esPanelControl && (
        <div className="sticky top-16 z-40 bg-gradient-to-r from-gris via-white to-gris border-b border-gray-200 shadow-md">
          <div className="px-4 py-3 relative">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center justify-center gap-3">
                <div className="hidden sm:flex items-center gap-1 text-[#7a0202]">
                  <CalendarIcon className="w-5 h-5" />
                </div>

                {/* INPUT ENTRADA */}
                <div className="flex items-center gap-2 relative">
                  <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Entrada</label>
                  <button onClick={() => setCalendarioAbierto(calendarioAbierto === 'entrada' ? null : 'entrada')}
                    className="px-3 py-1.5 min-w-28 rounded-lg text-left text-sm font-medium transition-all duration-200 bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner">
                    {formularioReserva.rango?.from ? formatearFecha(formularioReserva.rango.from, 'corta') : '—'}
                  </button>
                  <CalendarioStyles />
                  <CalendarioPicker esMobile={esMobile} calendarioAbierto={calendarioAbierto} handleSeleccionRango={(rango) => formularioReserva.setRango(rango)}
                    formularioReserva={formularioReserva} preciosPorDia={preciosPorDia} setCalendarioAbierto={setCalendarioAbierto} tipo="entrada" formatearISO={formatearISO}
                    calendarioRef={calendarioRef} components={componentesDia} />
                </div>

                {/* INPUT SALIDA */}
                <div className="flex items-center gap-2 relative">
                  <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Salida</label>
                  <button
                    onClick={() => setCalendarioAbierto(calendarioAbierto === 'salida' ? null : 'salida')}
                    className="px-3 py-1.5 min-w-28 rounded-lg text-left text-sm font-medium transition-all duration-200 bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formularioReserva.rango?.from}
                  >
                    {formularioReserva.rango?.to ? formatearFecha(formularioReserva.rango.to, 'corta') : '—'}
                  </button>
                  <CalendarioStyles />
                  {formularioReserva.rango?.from && (
                    <CalendarioPicker esMobile={esMobile} calendarioAbierto={calendarioAbierto}
                      handleSeleccionRango={(rango) => formularioReserva.setRango(rango)} formularioReserva={formularioReserva} preciosPorDia={preciosPorDia}
                      setCalendarioAbierto={setCalendarioAbierto} tipo="salida" formatearISO={formatearISO}
                      calendarioRef={calendarioRef} components={componentesDia} />
                  )}
                </div>

                {noches > 0 && (
                  <div className="flex flex-row items-center gap-1.5 px-2 py-1 bg-gris rounded">
                    <span className="text-xs font-semibold text-gray-600">Noches:</span>
                    <span className="text-xs font-bold text-[#7a0202]">{noches}</span>
                  </div>
                )}
              </div>

              {/* TYPING ANIMATION Y BUSCADOR */}
              <div className="hidden lg:flex items-center gap-4 px-2 py-1 absolute right-4">
                <div className="text-xs flex-1">
                  <TypingAnimation typeSpeed={60} deleteSpeed={40} pauseDelay={2500} loop={true}
                    words={['🔒 Tus datos protegidos', 'Gestiona tu reserva desde cualquier lugar', 'Cancelación gratuita hasta 48h antes de la llegada' ]}/>
                </div>
                <div className="flex-shrink-0 w-80">
                  <BuscadorNavbar />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
