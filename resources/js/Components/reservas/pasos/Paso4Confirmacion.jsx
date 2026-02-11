import Modal from '@/Components/Modal';
import ModalConfirmacionReserva from '@/Components/reservas/modales/ModalConfirmacionReserva';
import OpcionesPago from '@/Components/reservas/modales/OpcionesPago';
import DesgloseFactura from '@/Components/reservas/utilidades/DesgloseFactura';
import ReservaBreadcrumbs from '@/Components/reservas/utilidades/ReservaBreadcrumbs';
import Boton from '@/Components/UI/Boton';
import useConfirmacionReserva from '@/hooks/reservas/useConfirmacionReserva';
import { t } from '@/i18n';
import { calcularNoches } from '@/utils/formatters';
import {
    ArrowLeftIcon,
    CheckBadgeIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import '../../../../css/paso4Confirmacion.css';

export default function Paso4Confirmacion({
    rango,
    watch,
    habitacionesSeleccionadas,
    getTotalHabitaciones,
    retrocederPaso,
    getValues,
    localizador,
    setPasoActual,
    agruparHabitacionesPorTipo,
    preciosPorTipo = {},
}) {
    const formData = watch();
    const {
        procesando,
        prepararDatosReserva,
        crearReservaAlLlegar: crearReservaHook,
    } = useConfirmacionReserva();

    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] =
        useState(false);
    const [datosReservaConfirmada] = useState(null);
    const [pagarAlLlegar, setPagarAlLlegar] = useState(false);
    const [opcionPagoSeleccionada, setOpcionPagoSeleccionada] = useState(true);
    const [monto, setMonto] = useState(0);
    const [errorPagoLocal, setErrorPagoLocal] = useState(null);

    const fechasRef = useRef(null);
    const highlightFechas = false;

    useEffect(() => {
        try {
            const noches =
                rango?.from && rango?.to
                    ? calcularNoches(rango.from, rango.to)
                    : 1;
            const tipos = Object.entries(
                habitacionesSeleccionadas || {},
            ).filter(([, r]) => (r.cantidad || 0) > 0);
            const tiposInfo = agruparHabitacionesPorTipo();

            const total = tipos.reduce((acc, [tipo, r]) => {
                const cantidad = Number(r.cantidad || 0);
                let precioPorNoche = 0;

                if (preciosPorTipo && preciosPorTipo[tipo] !== undefined) {
                    precioPorNoche = Number(preciosPorTipo[tipo] || 0);
                } else {
                    const datos = tiposInfo[tipo] || {};
                    precioPorNoche = Number(
                        datos.precioEntreNoche ??
                            datos.precioNoche ??
                            datos.precioTipo ??
                            datos.precioMinimo ??
                            0,
                    );
                }

                return acc + precioPorNoche * noches * cantidad;
            }, 0);

            setMonto(total);
        } catch (e) {
            console.debug(e);
        }
    }, [
        habitacionesSeleccionadas,
        preciosPorTipo,
        rango,
        agruparHabitacionesPorTipo,
    ]);

    return (
        <div
            className={`flex max-h-[92vh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-2xl md:max-h-[80vh]`}
        >
            <header
                className={`flex-none border-b border-[#7a0202] bg-[#7a0202] px-4 py-4 shadow-md sm:px-8 sm:py-6`}
            >
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                            {t('booking.confirmation')}
                        </h1>
                        <p className="text-sm font-medium text-zinc-200">
                            {t('booking.step_review_and_pay')}
                        </p>
                    </div>
                    <ReservaBreadcrumbs
                        activeIndex={3}
                        className="text-zinc-200"
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-gray-50 p-6 pb-36 md:p-8 md:pb-8">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-5">
                        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div
                                className={`border-b border-[#7a0202] bg-[#7a0202] px-5 py-4`}
                            >
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                                    <CheckBadgeIcon className="h-5 w-5 text-zinc-100" />{' '}
                                    {t('booking.details_stay')}
                                </h3>
                            </div>

                            <div className="space-y-4 p-4">
                                {localizador && (
                                    <div
                                        className={`flex items-center justify-between rounded-lg border border-[#7a0202]/20 bg-[#7a0202]/10 px-4 py-3`}
                                    >
                                        <span
                                            className={`text-[11px] font-black uppercase tracking-wider text-[#7a0202]`}
                                        >
                                            {t('booking.locator')}
                                        </span>
                                        <span
                                            className={`font-mono text-xl font-black tracking-widest text-[#7a0202]`}
                                        >
                                            {localizador}
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6 border-b border-zinc-100 pb-5">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                            {t('booking.primary_holder')}
                                        </label>
                                        <p className="truncate text-sm font-bold text-zinc-900">
                                            {formData.name || '—'}
                                        </p>
                                        <p className="truncate text-xs text-zinc-500">
                                            {formData.email}
                                        </p>
                                    </div>
                                    <div
                                        ref={fechasRef}
                                        className={`-m-2 rounded-md p-2 transition-all duration-500 ${highlightFechas ? `bg-[#7a0202]/5 ring-2 ring-[#7a0202]` : ''}`}
                                    >
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                            {t('booking.stay_dates')}
                                        </label>
                                        <p className="text-sm font-bold text-zinc-900">
                                            {rango?.from?.toLocaleDateString()}{' '}
                                            <span className="mx-1 text-zinc-400">
                                                →
                                            </span>{' '}
                                            {rango?.to?.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <DesgloseFactura
                                    habitacionesSeleccionadas={
                                        habitacionesSeleccionadas
                                    }
                                    rango={rango}
                                    monto={monto}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                    agruparHabitacionesPorTipo={
                                        agruparHabitacionesPorTipo
                                    }
                                    tarifasAplicadas={[]}
                                    cargoTarifas={0}
                                    preciosPorTipo={preciosPorTipo}
                                    theme="light"
                                />
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-7">
                        <section className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div
                                className={`border-b border-[#7a0202] bg-[#7a0202] px-5 py-4`}
                            >
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                                    <CreditCardIcon className="h-5 w-5 text-zinc-100" />{' '}
                                    {t('payment.method_and_completion')}
                                </h3>
                            </div>
                            <div className="p-3 lg:p-5">
                                <OpcionesPago
                                    pagarAlLlegar={pagarAlLlegar}
                                    setPagarAlLlegar={setPagarAlLlegar}
                                    opcionPagoSeleccionada={
                                        opcionPagoSeleccionada
                                    }
                                    setOpcionPagoSeleccionada={
                                        setOpcionPagoSeleccionada
                                    }
                                    procesando={procesando}
                                    crearReservaAlLlegar={crearReservaHook}
                                    prepararDatosReserva={() =>
                                        prepararDatosReserva({
                                            getValues,
                                            rango,
                                            habitacionesSeleccionadas,
                                        })
                                    }
                                    rango={rango}
                                    monto={monto}
                                    errorPago={errorPagoLocal}
                                    setErrorPago={setErrorPagoLocal}
                                    setPasoActual={setPasoActual}
                                    formData={formData}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                />
                            </div>
                        </section>
                    </div>
                </div>
                <div className="h-36 md:hidden" aria-hidden="true" />
            </main>

            <footer className="flex-none border-t border-zinc-200 bg-white px-8 py-5">
                <div className="flex items-center justify-start">
                    <Boton
                        variant="ghost"
                        size="sm"
                        className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        icon={ArrowLeftIcon}
                        onClick={retrocederPaso}
                    >
                        {t('booking.back_and_edit')}
                    </Boton>
                </div>
            </footer>

            <ModalConfirmacionReserva
                reserva={datosReservaConfirmada}
                isOpen={mostrarModalConfirmacion}
                onClose={() => setMostrarModalConfirmacion(false)}
            />

            <Modal show={false} onClose={() => {}} maxWidth="md">
                <div className="p-6">
                    <div
                        className={`mb-4 flex items-center gap-3 text-[#7a0202]`}
                    >
                        <div className={`rounded-full bg-[#7a0202]/10 p-2`}>
                            <CheckBadgeIcon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black">
                            {t('booking.existing_client_detected')}
                        </h3>
                    </div>

                    <p className="mb-6 text-sm text-gray-600">
                        {t('booking.existing_client_message')}
                    </p>

                    <div className="flex justify-end gap-3">
                        <Boton variant="secondary">{t('actions.cancel')}</Boton>
                        <Boton
                            className={`border-transparent bg-[#7a0202] text-white hover:bg-[#7a0202]/90`}
                        >
                            {t('actions.confirm')}
                        </Boton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
