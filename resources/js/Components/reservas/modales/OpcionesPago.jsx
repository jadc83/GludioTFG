import ErrorBoundary from '@/Components/ErrorBoundary';
import FormularioPago from '@/Components/formularios/create/FormularioPago';
import {
    BuildingLibraryIcon,
    CheckCircleIcon,
    CreditCardIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
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
    setPasoActual,
}) {
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const reservaData =
        typeof prepararDatosReserva === 'function'
            ? prepararDatosReserva()
            : null;

    const cardBaseClass =
        'relative flex flex-col p-5 border-2 transition-all duration-300 cursor-pointer rounded-xl group';
    const activeClass = 'border-[#7a0202] bg-white shadow-md';
    const inactiveClass = 'border-gray-100 bg-gris hover:border-gray-300';

    return (
        <div className="space-y-8">
            {/* SELECTORES DE MODO */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* OPCIÓN: TARJETA (STRIPE) */}
                <div
                    onClick={() => {
                        setPagarAlLlegar(false);
                        setOpcionPagoSeleccionada(true);
                    }}
                    className={`${cardBaseClass} ${!pagarAlLlegar ? activeClass : inactiveClass}`}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <CreditCardIcon
                            className={`h-6 w-6 ${!pagarAlLlegar ? 'text-[#7a0202]' : 'text-gray-400'}`}
                        />
                        {!pagarAlLlegar && (
                            <CheckCircleIcon className="h-5 w-5 text-[#7a0202]" />
                        )}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                        Pago con Tarjeta
                    </span>
                    <span className="mt-1 text-[9px] font-bold uppercase text-gray-400">
                        Pasarela Stripe SSL
                    </span>
                </div>

                {/* OPCIÓN: RECEPCIÓN */}
                <div
                    onClick={() => {
                        setPagarAlLlegar(true);
                        setOpcionPagoSeleccionada(true);
                    }}
                    className={`${cardBaseClass} ${pagarAlLlegar ? activeClass : inactiveClass}`}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <BuildingLibraryIcon
                            className={`h-6 w-6 ${pagarAlLlegar ? 'text-[#7a0202]' : 'text-gray-400'}`}
                        />
                        {pagarAlLlegar && (
                            <CheckCircleIcon className="h-5 w-5 text-[#7a0202]" />
                        )}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                        En Recepción
                    </span>
                    <span className="mt-1 text-[9px] font-bold uppercase text-gray-400">
                        Pago durante el check-in
                    </span>
                </div>
            </div>

            {/* ÁREA DINÁMICA DE PAGO */}
            <div className="min-h-[100px] transition-all duration-500">
                {opcionPagoSeleccionada && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {!pagarAlLlegar ? (
                            /* FLOW: STRIPE */
                            <div className="rounded-xl bg-gris p-2">
                                <div className="flex justify-center">
                                    {!reservaData ||
                                    !reservaData.check_in ||
                                    !reservaData.check_out ||
                                    !(
                                        Array.isArray(
                                            reservaData.habitaciones,
                                        ) && reservaData.habitaciones.length > 0
                                    ) ? (
                                        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-6 text-center">
                                            <p className="mb-3 text-[11px] font-bold text-yellow-800">
                                                Faltan fechas o habitaciones
                                            </p>
                                            <p className="mb-4 text-[10px] text-yellow-700">
                                                Selecciona fechas y al menos una
                                                habitación antes de continuar
                                                con el pago.
                                            </p>
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        try {
                                                            window.dispatchEvent(
                                                                new CustomEvent(
                                                                    'faltanFechas',
                                                                ),
                                                            );
                                                        } catch (e) {}
                                                        if (
                                                            typeof setPasoActual ===
                                                            'function'
                                                        )
                                                            setPasoActual(1);
                                                    }}
                                                    className="rounded bg-[#7a0202] px-4 py-2 font-bold text-white"
                                                >
                                                    Seleccionar fechas
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <ErrorBoundary>
                                            <FormularioPago
                                                reservaData={reservaData}
                                                monto={monto}
                                                aceptaTerminos={aceptaTerminos}
                                                mostrarAceptacion={true} // El formulario de pago ya gestiona su aceptación
                                                onCambioAceptaTerminos={
                                                    setAceptaTerminos
                                                }
                                                onPagoExitoso={(data) => {
                                                    setDatosReservaConfirmada({
                                                        localizador:
                                                            data?.localizador ||
                                                            localizador,
                                                        nombre: formData.name,
                                                        check_in: rango?.from,
                                                        check_out: rango?.to,
                                                        cantidad_habitaciones:
                                                            getTotalHabitaciones(),
                                                        precio_total: monto,
                                                        pagoAlLlegar: false,
                                                    });
                                                    setMostrarModalConfirmacion(
                                                        true,
                                                    );
                                                }}
                                                onError={setErrorPago}
                                            />
                                        </ErrorBoundary>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* FLOW: RECEPCIÓN */
                            <div className="space-y-6">
                                <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                                    <ShieldCheckIcon className="mb-3 h-8 w-8 text-gray-300" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Garantía de Reserva
                                    </p>
                                    <p className="mt-2 text-[11px] font-bold text-gray-600">
                                        No se realizará ningún cargo ahora.{' '}
                                        <br /> La confirmación es inmediata.
                                    </p>
                                </div>

                                {/* Términos y botón en la misma línea cuando hay espacio */}
                                <div className="px-2">
                                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                                        <label className="flex cursor-pointer items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={aceptaTerminos}
                                                onChange={(e) =>
                                                    setAceptaTerminos(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202]"
                                            />
                                            <span className="text-[10px] font-bold uppercase leading-normal tracking-tight text-gray-400">
                                                Acepto las{' '}
                                                <span className="text-gray-900 underline">
                                                    condiciones de cancelación
                                                </span>{' '}
                                                y los términos del hotel.
                                            </span>
                                        </label>

                                        <div className="mt-2 w-full sm:w-1/2 md:w-1/3">
                                            <button
                                                onClick={crearReservaAlLlegar}
                                                disabled={
                                                    procesando ||
                                                    !aceptaTerminos
                                                }
                                                className="w-full rounded-xl bg-[#7a0202] py-7 text-[12px] font-black uppercase tracking-[0.3em] text-white shadow-xl transition-all hover:bg-black active:scale-[0.97] disabled:opacity-20 disabled:grayscale"
                                            >
                                                {procesando
                                                    ? 'Confirmando...'
                                                    : 'Finalizar Reserva'}
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
                <div className="flex items-center gap-4 rounded-r-lg border-l-4 border-red-600 bg-red-50 p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-800">
                        {errorPago}
                    </span>
                </div>
            )}
        </div>
    );
}
