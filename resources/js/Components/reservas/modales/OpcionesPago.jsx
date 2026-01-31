import PrimaryButton from '@/Components/UI/PrimaryButton';
import FormularioPago from '@/Components/pagos/FormularioPago';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { useState } from 'react';
import {
    CreditCardIcon,
    BuildingLibraryIcon,
    CheckCircleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function OpcionesPago({
    pagarAlLlegar,
    setPagarAlLlegar,
    opcionPagoSeleccionada,
    setOpcionPagoSeleccionada,
    procesando,
    crearReservaAlLlegar,
    prepararDatosReserva,
    monto,
    rango,
    getTotalHabitaciones,
    formData,
    localizador,
    setDatosReservaConfirmada,
    setMostrarModalConfirmacion,
    setErrorPago,
    errorPago,
    setPasoActual,
}) {
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const reservaData = (typeof prepararDatosReserva === 'function') ? prepararDatosReserva() : null;

    const cardBaseClass = "relative flex flex-col p-5 border-2 transition-all duration-300 cursor-pointer rounded-xl group";
    const activeClass = "border-[#7a0202] bg-white shadow-md";
    const inactiveClass = "border-gray-100 bg-gris hover:border-gray-300";

    return (
        <div className="space-y-8">
            {/* SELECTORES DE MODO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* OPCIÓN: TARJETA (STRIPE) */}
                <div
                    onClick={() => { setPagarAlLlegar(false); setOpcionPagoSeleccionada(true); }}
                    className={`${cardBaseClass} ${!pagarAlLlegar ? activeClass : inactiveClass}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <CreditCardIcon className={`h-6 w-6 ${!pagarAlLlegar ? 'text-[#7a0202]' : 'text-gray-400'}`} />
                        {!pagarAlLlegar && <CheckCircleIcon className="h-5 w-5 text-[#7a0202]" />}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">Pago con Tarjeta</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">Pasarela Stripe SSL</span>
                </div>

                {/* OPCIÓN: RECEPCIÓN */}
                <div
                    onClick={() => { setPagarAlLlegar(true); setOpcionPagoSeleccionada(true); }}
                    className={`${cardBaseClass} ${pagarAlLlegar ? activeClass : inactiveClass}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <BuildingLibraryIcon className={`h-6 w-6 ${pagarAlLlegar ? 'text-[#7a0202]' : 'text-gray-400'}`} />
                        {pagarAlLlegar && <CheckCircleIcon className="h-5 w-5 text-[#7a0202]" />}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">En Recepción</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">Pago durante el check-in</span>
                </div>
            </div>

            {/* ÁREA DINÁMICA DE PAGO */}
            <div className="min-h-[100px] transition-all duration-500">
                {opcionPagoSeleccionada && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

                        {!pagarAlLlegar ? (
                            /* FLOW: STRIPE */
                            <div className="bg-gris rounded-xl p-2">
                                <div className="flex justify-center">
                                    { (!reservaData || !reservaData.check_in || !reservaData.check_out || !(Array.isArray(reservaData.habitaciones) && reservaData.habitaciones.length > 0)) ? (
                                        <div className="p-6 bg-yellow-50 border border-yellow-300 rounded-xl text-center">
                                            <p className="text-[11px] font-bold text-yellow-800 mb-3">Faltan fechas o habitaciones</p>
                                            <p className="text-[10px] text-yellow-700 mb-4">Selecciona fechas y al menos una habitación antes de continuar con el pago.</p>
                                            <div className="flex justify-center gap-3">
                                                <button type="button" onClick={() => { try { window.dispatchEvent(new CustomEvent('faltanFechas')); } catch (e){}; if (typeof setPasoActual === 'function') setPasoActual(1); }} className="py-2 px-4 rounded bg-[#7a0202] text-white font-bold">Seleccionar fechas</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <ErrorBoundary>
                                            <FormularioPago
                                                reservaData={reservaData}
                                                monto={monto}
                                                aceptaTerminos={aceptaTerminos}
                                                mostrarAceptacion={true} // El formulario de pago ya gestiona su aceptación
                                                onAceptaChange={setAceptaTerminos}
                                                onPagoExitoso={(data) => {
                                                    setDatosReservaConfirmada({
                                                        localizador: data?.localizador || localizador,
                                                        nombre: formData.name,
                                                        check_in: rango?.from,
                                                        check_out: rango?.to,
                                                        cantidad_habitaciones: getTotalHabitaciones(),
                                                        precio_total: monto,
                                                        pagoAlLlegar: false
                                                    });
                                                    setMostrarModalConfirmacion(true);
                                                }}
                                                onError={setErrorPago}
                                            />
                                        </ErrorBoundary>
                                    ) }
                                </div>
                            </div>
                        ) : (
                            /* FLOW: RECEPCIÓN */
                            <div className="space-y-6">
                                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl border-dashed flex flex-col items-center text-center">
                                    <ShieldCheckIcon className="h-8 w-8 text-gray-300 mb-3" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Garantía de Reserva</p>
                                    <p className="text-[11px] font-bold text-gray-600 mt-2">No se realizará ningún cargo ahora. <br/> La confirmación es inmediata.</p>
                                </div>

                                {/* Términos y botón en la misma línea cuando hay espacio */}
                                <div className="px-2">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={aceptaTerminos}
                                                onChange={(e) => setAceptaTerminos(e.target.checked)}
                                                className="rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                            />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-normal">
                                                Acepto las <span className="text-gray-900 underline">condiciones de cancelación</span> y los términos del hotel.
                                            </span>
                                        </label>

                                        <div className="w-full sm:w-1/2 md:w-1/3 mt-2">
                                            <button
                                                onClick={crearReservaAlLlegar}
                                                disabled={procesando || !aceptaTerminos}
                                                className="w-full py-7 rounded-xl  bg-[#7a0202] text-white font-black text-[12px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-[0.97] disabled:opacity-20 disabled:grayscale"
                                            >
                                                {procesando ? 'Confirmando...' : 'Finalizar Reserva'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ERRORES */}
            {errorPago && (
                <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg flex items-center gap-4">
                    <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">{errorPago}</span>
                </div>
            )}
        </div>
    );
}
