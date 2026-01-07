import PrimaryButton from '../PrimaryButton';
import FormularioPago from '../pagos/FormularioPago';

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
    return (
        <div className="space-y-1">
            {/* Opción de pago - PRIMERO elegir, LUEGO mostrar formulario */}
            <div className="pt-1 space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-0.5">Forma de Pago</h4>
                <div className="flex gap-1">
                    <label className="flex-1 flex items-center gap-1 p-2 rounded border-2 cursor-pointer transition text-xs"
                        style={{ borderColor: !pagarAlLlegar ? '#dc2626' : '#d1d5db', backgroundColor: !pagarAlLlegar ? '#fef2f2' : '#f3f4f6'}}>
                        <input type="radio" name="metodoPago" checked={!pagarAlLlegar} onChange={() => {
                                setPagarAlLlegar(false);
                                setOpcionPagoSeleccionada(true);
                            }} className="h-3 w-3 cursor-pointer" />
                        <span className="font-medium text-gray-900 text-[11px]">Tarjeta</span>
                    </label>

                    <label className="flex-1 flex items-center gap-1 p-2 rounded border-2 cursor-pointer transition text-xs"
                        style={{ borderColor: pagarAlLlegar ? '#7a0202' : '#d1d5db', backgroundColor: pagarAlLlegar ? '#fef2f2' : '#f3f4f6'}}>
                        <input type="radio" name="metodoPago" checked={pagarAlLlegar} onChange={() => {
                                setPagarAlLlegar(true);
                                setOpcionPagoSeleccionada(true);}}
                            className="h-3 w-3 cursor-pointer"/>
                        <span className="font-medium text-gray-900 text-[11px]">En recepción</span>
                    </label>
                </div>
            </div>

            {/* Formulario de Pago o Confirmación */}
            <div className="border-t border-gray-200 pt-0.5 mt-0.5">
                {!opcionPagoSeleccionada && (
                    <div className="text-center py-0.5 text-[11px] text-gray-500">
                        <p>Selecciona una forma de pago</p>
                    </div>
                )}

                {opcionPagoSeleccionada && !pagarAlLlegar && (
                    <>
                        <h4 className="mb-0.5 text-center text-xs font-bold text-gray-900">Formulario de Pago</h4>
                        <FormularioPago reservaData={prepararDatosReserva()} monto={monto} pagarAlLlegar={false}
                                        onPagoExitoso={(data) => { const localizadorDelPago = data?.localizador || localizador;
                                            setDatosReservaConfirmada({ localizador: localizadorDelPago,
                                                                                     nombre: formData.name,
                                                                                     check_in: rango?.from,
                                                                                     check_out: rango?.to,
                                                                                     cantidad_habitaciones: getTotalHabitaciones(),
                                                                                     precio_total: monto});
                                        setMostrarModalConfirmacion(true);}} onError={(mensaje) => { setErrorPago(mensaje);}}/>
                        </>
                )}

                {opcionPagoSeleccionada && pagarAlLlegar && (
                    <div className="text-center py-0.5">
                        <p className="text-gray-600 mb-0.5 text-[11px]">Pago en recepción.</p>
                        <button onClick={crearReservaAlLlegar} disabled={procesando}
                            className="inline-flex items-center justify-center rounded bg-[#7a0202] px-2.5 py-1 font-semibold text-white text-xs hover:bg-[#6b0101] transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {procesando ? 'Creando...' : 'Confirmar'}
                        </button>
                    </div>
                )}
            </div>

            {errorPago && (
                <div className="rounded border border-red-200 bg-red-50 p-0.5 text-[11px] text-red-700">
                    {errorPago}
                </div>
            )}
        </div>
    );
}
