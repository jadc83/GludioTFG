import BuscadorNavbar from '@/Components/buscadores/BuscadorNavbar';
import Campo from '@/Components/formulario/Campo';
import {
    ArrowDownOnSquareIcon,
    ArrowUpOnSquareIcon,
    CalendarIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import '../../../css/createHabitacion.css';
import '../../../css/estiloCalendario.css';
import '../../../css/estiloMenuLateral.css';
import useCalendarioDia from '../../hooks/calendario/useCalendarioDia';
import useCalendarioPrecios from '../../hooks/calendario/useCalendarioPrecios';
import useReservaForm from '../../hooks/reservas/useReservaForm';
import { formatearFecha } from '../../utils/formatters';
import CalendarioPicker, { CalendarioStyles } from './CalendarioPicker';
import ModalPaso from './pasos/ModalPaso';
import Paso2Habitaciones from './pasos/Paso2Habitaciones';
import Paso3Datos from './pasos/Paso3Datos';
import Paso4Confirmacion from './pasos/Paso4Confirmacion';

export default function BarraReservas() {
    const formularioReserva = useReservaForm();
    const pagina = usePage();
    const esPanelControl =
        pagina.url?.includes('panel') || pagina.component === 'PanelControl';
    const [calendarioAbierto, setCalendarioAbierto] = useState(null);
    const { preciosPorDia, consultaPrecios, formatearISO, esMobile } =
        useCalendarioPrecios();
    const calendarioRef = useRef(null);

    // Cerrar calendario al hacer click fuera
    useEffect(() => {
        if (!calendarioAbierto) return;

        const handleClickOutside = (event) => {
            if (
                calendarioRef.current &&
                !calendarioRef.current.contains(event.target)
            ) {
                setCalendarioAbierto(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [calendarioAbierto]);

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

    const mapaPrecios = useMemo(() => preciosPorDia || {}, [preciosPorDia]);
    const componentesDia = useCalendarioDia(mapaPrecios, formatearISO);

    return (
        <>
            {/* MODALES */}
            <ModalPaso
                paso={2}
                pasoActual={formularioReserva.pasoActual}
                onClose={() => formularioReserva.retrocederPaso()}
                maxWidth="fit"
            >
                <Paso2Habitaciones {...formularioReserva} />
            </ModalPaso>

            <ModalPaso
                paso={3}
                pasoActual={formularioReserva.pasoActual}
                onClose={() => formularioReserva.retrocederPaso()}
                maxWidth="max-w-2xl"
            >
                <Paso3Datos {...formularioReserva} />
            </ModalPaso>

            <ModalPaso
                paso={4}
                pasoActual={formularioReserva.pasoActual}
                onClose={() => formularioReserva.retrocederPaso()}
                maxWidth="max-w-4xl"
            >
                <Paso4Confirmacion
                    {...formularioReserva}
                    usuarioActual={formularioReserva.usuarioActual}
                    getValues={formularioReserva.getValues}
                    idClienteSeleccionado={
                        formularioReserva.idClienteSeleccionado
                    }
                    tipoClienteSeleccionado={
                        formularioReserva.tipoClienteSeleccionado
                    }
                    habitacionesDisponibles={
                        formularioReserva.habitacionesDisponibles
                    }
                />
            </ModalPaso>

            {/* BARRA STICKY */}
            {!esPanelControl && (
                <div className="sticky top-16 z-40 bg-gris shadow-md">
                    <div className="relative px-4 py-3">
                        <div className="flex items-center justify-center gap-3 md:justify-center">
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <div className="hidden items-center gap-1 text-[#7a0202] sm:flex">
                                    <CalendarIcon className="h-5 w-5" />
                                </div>

                                {/* INPUT ENTRADA */}
                                <div className="relative flex items-center gap-2">
                                    <label className="whitespace-nowrap text-xs font-semibold text-gray-700">
                                        <span className="hidden sm:inline">
                                            Entrada
                                        </span>
                                        <span className="inline-flex sm:hidden">
                                            <ArrowDownOnSquareIcon className="h-5 w-5 text-[#7a0202]" />
                                        </span>
                                    </label>
                                    <button
                                        onClick={() =>
                                            setCalendarioAbierto(
                                                calendarioAbierto === 'entrada'
                                                    ? null
                                                    : 'entrada',
                                            )
                                        }
                                        className="truncate rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner"
                                        aria-label="Seleccionar fecha de entrada"
                                    >
                                        {formularioReserva.rango?.from
                                            ? formatearFecha(
                                                  formularioReserva.rango.from,
                                                  'corta',
                                              )
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
                                        setCalendarioAbierto={
                                            setCalendarioAbierto
                                        }
                                        tipo="entrada"
                                        formatearISO={formatearISO}
                                        calendarioRef={calendarioRef}
                                        components={componentesDia}
                                    />
                                </div>

                                {/* INPUT SALIDA */}
                                <div className="relative flex items-center gap-2">
                                    <label className="whitespace-nowrap text-xs font-semibold text-gray-700">
                                        <span className="hidden sm:inline">
                                            Salida
                                        </span>
                                        <span className="inline-flex sm:hidden">
                                            <ArrowUpOnSquareIcon className="h-5 w-5 text-gray-700" />
                                        </span>
                                    </label>
                                    <button
                                        onClick={() =>
                                            setCalendarioAbierto(
                                                calendarioAbierto === 'salida'
                                                    ? null
                                                    : 'salida',
                                            )
                                        }
                                        disabled={
                                            !formularioReserva.rango?.from
                                        }
                                        className="truncate rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7a0202] focus:ring-offset-1 active:shadow-inner disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Seleccionar fecha de salida"
                                    >
                                        {formularioReserva.rango?.to
                                            ? formatearFecha(
                                                  formularioReserva.rango.to,
                                                  'corta',
                                              )
                                            : '—'}
                                    </button>
                                    <CalendarioStyles />
                                    {formularioReserva.rango?.from && (
                                        <CalendarioPicker
                                            esMobile={esMobile}
                                            calendarioAbierto={
                                                calendarioAbierto
                                            }
                                            handleSeleccionRango={(rango) =>
                                                formularioReserva.setRango(
                                                    rango,
                                                )
                                            }
                                            formularioReserva={
                                                formularioReserva
                                            }
                                            preciosPorDia={preciosPorDia}
                                            setCalendarioAbierto={
                                                setCalendarioAbierto
                                            }
                                            tipo="salida"
                                            formatearISO={formatearISO}
                                            calendarioRef={calendarioRef}
                                            components={componentesDia}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-row items-center gap-1.5 rounded bg-gris px-2 py-1">
                                    <label className="whitespace-nowrap text-xs font-semibold text-gray-700">
                                        <span className="hidden sm:inline">
                                            Huéspedes:
                                        </span>
                                        <span className="inline-flex sm:hidden">
                                            <UserGroupIcon className="h-5 w-5 text-gray-700" />
                                        </span>
                                    </label>
                                    <Campo
                                        id="num_huespedes_barra"
                                        type="number"
                                        min={1}
                                        sinEstilosPorDefecto={true}
                                        value={formularioReserva.numHuespedes}
                                        onChange={(e) =>
                                            formularioReserva.setNumHuespedes(
                                                Math.max(
                                                    1,
                                                    Number(e.target.value) || 1,
                                                ),
                                            )
                                        }
                                        clase="w-16 text-sm px-2 py-1 rounded border border-gray-300 bg-white text-gray-700"
                                    />
                                </div>
                            </div>

                            <div className="absolute right-4 hidden items-center gap-4 px-2 py-1 lg:flex">
                                <div className="w-80 flex-shrink-0">
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
