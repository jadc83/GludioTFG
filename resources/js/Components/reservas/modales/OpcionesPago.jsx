import PrimaryButton from '@/Components/UI/PrimaryButton';
import FormularioPago from '@/Components/pagos/FormularioPago';
import { useState } from 'react';

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
}) {
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    return (
        <div className="bg-gris rounded-lg p-2 space-y-1 text-xs md:text-sm">
            {/* Opción de pago */}
            <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1 text-center">Forma de Pago</h4>
                <div className="flex flex-col md:flex-row justify-center gap-3">
                    <label
                        className={`flex w-full md:w-auto items-center gap-3 p-3 rounded-xl border transition-transform hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${!pagarAlLlegar ? 'border-[#7a0202] bg-white' : 'border-gray-200 bg-gris'}`}
                        onClick={() => { setPagarAlLlegar(false); setOpcionPagoSeleccionada(true); }}
                    >
                        <input type="radio" name="metodoPago" checked={!pagarAlLlegar} readOnly className="sr-only" />
                        <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-sm text-gray-900">Tarjeta</div>
                                    <div className="text-xs text-gray-500">Pago seguro con tarjeta (Stripe)</div>
                                </div>
                                { !pagarAlLlegar && (
                                    <div className="ml-3 h-6 w-6 rounded-full bg-[#7a0202] flex items-center justify-center text-white text-xs">✓</div>
                                ) }
                            </div>
                        </div>
                    </label>

                    <label
                        className={`flex w-full md:w-auto items-center gap-3 p-3 rounded-xl border transition-transform hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${pagarAlLlegar ? 'border-[#7a0202] bg-white' : 'border-gray-200 bg-gris'}`}
                        onClick={() => { setPagarAlLlegar(true); setOpcionPagoSeleccionada(true); }}
                    >
                        <input type="radio" name="metodoPago" checked={pagarAlLlegar} readOnly className="sr-only" />
                        <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-sm text-gray-900">En recepción</div>
                                    <div className="text-xs text-gray-500">Paga en el hotel al hacer check-in</div>
                                </div>
                                { pagarAlLlegar && (
                                    <div className="ml-3 h-6 w-6 rounded-full bg-[#7a0202] flex items-center justify-center text-white text-xs">✓</div>
                                ) }
                            </div>
                        </div>
                    </label>
                </div>
            </div>
                {!opcionPagoSeleccionada && (
                    <div className="text-center py-2 text-xs text-gray-500">
                        <p>Selecciona una forma de pago</p>
                    </div>
                )}

                {opcionPagoSeleccionada && !pagarAlLlegar && (
                    <>
                        <FormularioPago
                            reservaData={prepararDatosReserva()}
                            monto={monto}
                            pagarAlLlegar={false}
                            aceptaTerminos={aceptaTerminos}
                            onPagoExitoso={(data) => {
                                const localizadorDelPago = data?.localizador || localizador;
                                setDatosReservaConfirmada({
                                    localizador: localizadorDelPago,
                                    nombre: formData.name,
                                    check_in: rango?.from,
                                    check_out: rango?.to,
                                    cantidad_habitaciones: getTotalHabitaciones(),
                                    precio_total: monto,
                                    pagoAlLlegar: false
                                });
                                setMostrarModalConfirmacion(true);
                            }}
                            onError={(mensaje) => {
                                setErrorPago(mensaje);
                            }}
                        />
                    </>
                )}

                {opcionPagoSeleccionada && pagarAlLlegar && (
                    <div className="text-center py-2">
                        <p className="text-gray-600 mb-2 text-xs">Pago en recepción</p>
                        <PrimaryButton onClick={crearReservaAlLlegar} disabled={procesando || !aceptaTerminos} className="w-full justify-center">
                            {procesando ? 'Creando...' : 'Confirmar Reserva'}
                        </PrimaryButton>
                    </div>
                )}

            {/* Términos y condiciones */}
            {opcionPagoSeleccionada && (
                <div className="border-t border-gray-300 pt-2 mt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} className="sr-only" />
                        <div className={`h-4 w-4 rounded-sm flex items-center justify-center transition ${aceptaTerminos ? 'bg-[#7a0202] border-[#7a0202]' : 'bg-white border border-gray-300'}`}>
                            {aceptaTerminos && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className="text-xs text-gray-700 leading-tight">
                            Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#7a0202] hover:underline font-medium">términos y condiciones</a>. Cancelación gratuita hasta 48h antes del check-in.
                        </span>
                    </label>
                </div>
            )}

            {errorPago && (
                <div className="rounded border border-red-200 bg-red-100 p-2 text-xs text-red-800">
                    {errorPago}
                </div>
            )}
        </div>
    );
}
