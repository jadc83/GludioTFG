import PrimaryButton from '@/Components/PrimaryButton';
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
        <div className="bg-gris rounded-lg p-3 space-y-2">
            {/* Opción de pago */}
            <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Forma de Pago</h4>
                <div className="flex justify-center gap-4">
                    <label className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs">
                        <input type="radio" name="metodoPago" checked={!pagarAlLlegar} onChange={() => {
                                setPagarAlLlegar(false);
                                setOpcionPagoSeleccionada(true);
                            }} className="h-3 w-3 cursor-pointer" />
                        <span className="text-sm">💳</span>
                        <span className="font-medium text-gray-900 text-xs">Tarjeta</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs">
                        <input type="radio" name="metodoPago" checked={pagarAlLlegar} onChange={() => {
                                setPagarAlLlegar(true);
                                setOpcionPagoSeleccionada(true);}}
                            className="h-3 w-3 cursor-pointer"/>
                        <span className="text-sm">🏨</span>
                        <span className="font-medium text-gray-900 text-xs">En recepción</span>
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
                            onPagoExitoso={(data) => {
                                console.log('✅ Pago exitoso, datos recibidos:', data);
                                const localizadorDelPago = data?.localizador || localizador;
                                console.log('🔖 Localizador para modal:', localizadorDelPago);

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
                        <button onClick={crearReservaAlLlegar} disabled={procesando || !aceptaTerminos}
                            className="w-full bg-black text-white py-2 rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-[#7a0202] transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {procesando ? 'Creando...' : 'Confirmar Reserva'}
                        </button>
                    </div>
                )}

            {/* Términos y condiciones */}
            {opcionPagoSeleccionada && (
                <div className="border-t border-gray-300 pt-2 mt-2">
                    <label className="flex items-center justify-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={aceptaTerminos}
                            onChange={(e) => setAceptaTerminos(e.target.checked)}
                            className="h-3 w-3 cursor-pointer accent-black"
                        />
                        <span className="text-xs text-gray-700 text-center leading-tight">
                            Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">términos y condiciones</a>. Cancelación gratuita hasta 48h antes del check-in.
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
