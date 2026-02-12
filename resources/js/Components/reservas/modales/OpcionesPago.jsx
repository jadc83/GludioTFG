import ErrorBoundary from '@/Components/ErrorBoundary';
import FormularioPago from '@/Components/formularios/create/FormularioPago';
import CuponDescuento from '@/Components/reservas/utilidades/CuponDescuento';
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
    cuponDescuento,
    setCuponDescuento,
    aplicarCupon,
    cuponValido,
}) {
    const [aceptaTerminos, setAceptaTerminos] = useState(false);

    const reservaData =
        typeof prepararDatosReserva === 'function'
            ? prepararDatosReserva()
            : null;

    const esReservaInvalida =
        !reservaData ||
        !reservaData.check_in ||
        !reservaData.check_out ||
        !Array.isArray(reservaData.habitaciones) ||
        reservaData.habitaciones.length === 0;

    const cardBaseClass =
        'relative flex flex-col p-3 border-2 transition-all duration-300 cursor-pointer rounded-xl group';
    const activeClass = 'border-[#7a0202] bg-white shadow-md';
    const inactiveClass = 'border-gray-100 bg-gris hover:border-gray-300';

    return (
        <div className="space-y-2">
            <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Opciones de pago"
            >
                <div
                    onClick={() => {
                        setPagarAlLlegar(false);
                        setOpcionPagoSeleccionada(true);
                    }}
                    role="radio"
                    tabIndex={0}
                    aria-checked={!pagarAlLlegar}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPagarAlLlegar(false);
                            setOpcionPagoSeleccionada(true);
                        }
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

                <div
                    onClick={() => {
                        setPagarAlLlegar(true);
                        setOpcionPagoSeleccionada(true);
                    }}
                    role="radio"
                    tabIndex={0}
                    aria-checked={pagarAlLlegar}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPagarAlLlegar(true);
                            setOpcionPagoSeleccionada(true);
                        }
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

            <div className="min-h-[60px] transition-all duration-300">
                {opcionPagoSeleccionada && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {!pagarAlLlegar ? (
                            <div className="rounded-xl bg-gris p-1">
                                {esReservaInvalida ? (
                                    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-center">
                                        <p className="mb-3 text-[11px] font-bold uppercase text-yellow-800">
                                            Faltan fechas o habitaciones
                                        </p>
                                        <p className="mb-4 text-[10px] text-yellow-700">
                                            Selecciona fechas y al menos una
                                            habitación antes de continuar.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                typeof setPasoActual ===
                                                    'function' &&
                                                setPasoActual(1)
                                            }
                                            className="rounded bg-[#7a0202] px-4 py-2 text-[10px] font-bold uppercase text-white"
                                        >
                                            Seleccionar fechas
                                        </button>
                                    </div>
                                ) : (
                                    <ErrorBoundary>
                                        <FormularioPago
                                            reservaData={reservaData}
                                            monto={monto}
                                            aceptaTerminos={aceptaTerminos}
                                            mostrarAceptacion={false}
                                            onCambioAceptaTerminos={
                                                setAceptaTerminos
                                            }
                                            onPagoExitoso={(data) => {
                                                const loc =
                                                    data?.localizador ||
                                                    localizador;
                                                setDatosReservaConfirmada({
                                                    localizador: loc,
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
                                                if (loc)
                                                    window.location.href = `/reserva/${loc}`;
                                            }}
                                            onError={setErrorPago}
                                        />
                                    </ErrorBoundary>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center">
                                    <ShieldCheckIcon className="mb-3 h-8 w-8 text-gray-300" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Garantía de Reserva
                                    </p>
                                    <p className="mt-2 text-[11px] font-bold text-gray-600">
                                        No se realizará ningún cargo ahora.{' '}
                                        <br /> La confirmación es inmediata.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={async () => {
                                            try {
                                                setErrorPago &&
                                                    setErrorPago(null);
                                                const data =
                                                    await crearReservaAlLlegar(
                                                        reservaData,
                                                    );
                                                const loc =
                                                    data?.localizador ||
                                                    localizador;
                                                setDatosReservaConfirmada &&
                                                    setDatosReservaConfirmada({
                                                        localizador: loc,
                                                        nombre: formData.name,
                                                        check_in: rango?.from,
                                                        check_out: rango?.to,
                                                        cantidad_habitaciones:
                                                            getTotalHabitaciones(),
                                                        precio_total: monto,
                                                        pagoAlLlegar: true,
                                                    });
                                                setMostrarModalConfirmacion &&
                                                    setMostrarModalConfirmacion(
                                                        true,
                                                    );
                                                if (loc)
                                                    window.location.href = `/reserva/${loc}`;
                                            } catch (err) {
                                                const msg =
                                                    err?.message ||
                                                    err?.error ||
                                                    (err && err.status === 409
                                                        ? 'Cliente existente'
                                                        : 'Error al crear la reserva');
                                                setErrorPago &&
                                                    setErrorPago(msg);
                                            }
                                        }}
                                        disabled={procesando || !aceptaTerminos}
                                        className="w-full rounded-xl bg-[#7a0202] py-4 text-[12px] font-black uppercase tracking-[0.3em] text-white shadow-xl transition-all hover:bg-black active:scale-[0.97] disabled:opacity-20 disabled:grayscale sm:w-1/2 md:w-1/3"
                                        type="button"
                                    >
                                        {procesando
                                            ? 'Confirmando...'
                                            : 'Finalizar Reserva'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-3 flex flex-col gap-1 border-t border-gray-100 pt-2">
                    <CuponDescuento
                        value={cuponDescuento}
                        onChange={(e) => setCuponDescuento(e.target.value)}
                        onApply={aplicarCupon}
                    />

                    {cuponValido && (
                        <div className="flex items-center gap-2 rounded-md border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold text-green-700 shadow-sm">
                            <span>
                                Cupón aplicado: Ahorras €
                                {cuponValido.descuento.toFixed(2)}
                            </span>
                        </div>
                    )}

                    <label
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 flex cursor-pointer items-start gap-2"
                    >
                        <input
                            type="checkbox"
                            checked={aceptaTerminos}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                                setAceptaTerminos(e.target.checked)
                            }
                            className="mt-0.5 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202] pointer-events-auto"
                        />
                        <span className="text-[10px] font-bold uppercase leading-tight tracking-tight text-gray-400">
                            Acepto las{' '}
                            <span className="text-gray-900 underline">
                                condiciones de cancelación
                            </span>{' '}
                            y los términos del hotel.
                        </span>
                    </label>
                </div>
            </div>

            {errorPago && (
                <div className="flex items-center gap-3 rounded-r-lg border-l-4 border-red-600 bg-red-50 p-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-800">
                        {errorPago}
                    </span>
                </div>
            )}
        </div>
    );
}
