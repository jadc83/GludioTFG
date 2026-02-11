import Modal from '@/Components/Modal';
import ReservaBreadcrumbs from '@/Components/reservas/utilidades/ReservaBreadcrumbs';
import Boton from '@/Components/UI/Boton';
import useConfirmacionReserva from '@/hooks/reservas/useConfirmacionReserva';
import { ArrowLeftIcon, CheckBadgeIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../../../../css/paso4Confirmacion.css';
import ModalConfirmacionReserva from '@/Components/reservas/modales/ModalConfirmacionReserva';
import OpcionesPago from '@/Components/reservas/modales/OpcionesPago';
import { emitToast } from '@/utils/toast';
import DesgloseFactura from '@/Components/reservas/utilidades/DesgloseFactura';
import { t } from '@/i18n';

export default function Paso4Confirmacion({
    rango,
    watch,
    habitacionesSeleccionadas,
    getTotalHabitaciones,
    retrocederPaso,
    usuarioActual,
    getValues,
    idClienteSeleccionado,
    tipoClienteSeleccionado,
    localizador,
    setPasoActual,
    agruparHabitacionesPorTipo,
    preciosPorTipo = {},
    selectedTarifas = {},
}) {
    const formData = watch();
    const {
        procesando,
        prepararDatosReserva,
        crearReservaAlLlegar: crearReservaHook,
    } = useConfirmacionReserva();

    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [datosReservaConfirmada, setDatosReservaConfirmada] = useState(null);
    const [pagarAlLlegar, setPagarAlLlegar] = useState(false);
    const [opcionPagoSeleccionada, setOpcionPagoSeleccionada] = useState(true);
    const [monto, setMonto] = useState(0);
    const [errorPagoLocal, setErrorPagoLocal] = useState(null);

    const fechasRef = useRef(null);
    const highlightFechas = false;

    return (
        <div className={`flex min-h-0 max-h-[92vh] md:max-h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-2xl`}>
            <header className={`flex-none border-b border-${vinoBorder} bg-${vinoColor} px-4 py-4 sm:px-8 sm:py-6 shadow-md`}>
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{t('booking.confirmation')}</h1>
                        <p className="text-sm font-medium text-zinc-200">{t('booking.step_review_and_pay')}</p>
                    </div>
                    <ReservaBreadcrumbs activeIndex={3} className="text-zinc-200" />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8 pb-36 md:pb-8">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-5">
                        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className={`border-b border-${vinoBorder} bg-${vinoColor} px-5 py-4`}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                    <CheckBadgeIcon className="h-5 w-5 text-zinc-100" /> {t('booking.details_stay')}
                                </h3>
                            </div>

                            <div className="p-4 space-y-4">
                                {localizador && (
                                    <div className={`flex items-center justify-between rounded-lg bg-${vinoColor}/10 px-4 py-3 border border-${vinoColor}/20`}>
                                        <span className={`text-[11px] font-black uppercase text-${vinoColor} tracking-wider`}>{t('booking.locator')}</span>
                                        <span className={`font-mono text-xl font-black text-${vinoColor} tracking-widest`}>{localizador}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6 border-b border-zinc-100 pb-5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 block">{t('booking.primary_holder')}</label>
                                        <p className="text-sm font-bold text-zinc-900 truncate">{formData.name || '—'}</p>
                                        <p className="text-xs text-zinc-500 truncate">{formData.email}</p>
                                    </div>
                                    <div ref={fechasRef} className={`transition-all duration-500 rounded-md p-2 -m-2 ${highlightFechas ? `bg-${vinoColor}/5 ring-2 ring-${vinoColor}` : ''}`}>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 block">{t('booking.stay_dates')}</label>
                                        <p className="text-sm font-bold text-zinc-900">
                                            {rango?.from?.toLocaleDateString()} <span className="text-zinc-400 mx-1">→</span> {rango?.to?.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <DesgloseFactura
                                    habitacionesSeleccionadas={habitacionesSeleccionadas}
                                    rango={rango}
                                    monto={monto}
                                    getTotalHabitaciones={getTotalHabitaciones}
                                    agruparHabitacionesPorTipo={agruparHabitacionesPorTipo}
                                    tarifasAplicadas={[]}
                                    cargoTarifas={0}
                                    preciosPorTipo={preciosPorTipo}
                                    theme="light"
                                />
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-7">
                        <section className="h-full rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                            <div className={`border-b border-${vinoBorder} bg-${vinoColor} px-5 py-4`}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                    <CreditCardIcon className="h-5 w-5 text-zinc-100" /> {t('payment.method_and_completion')}
                                </h3>
                            </div>
                            <div className="p-3 lg:p-5">
                                <OpcionesPago
                                    pagarAlLlegar={pagarAlLlegar}
                                    setPagarAlLlegar={setPagarAlLlegar}
                                    opcionPagoSeleccionada={opcionPagoSeleccionada}
                                    setOpcionPagoSeleccionada={setOpcionPagoSeleccionada}
                                    procesando={procesando}
                                    crearReservaAlLlegar={crearReservaHook}
                                    prepararDatosReserva={() => prepararDatosReserva({ getValues, rango, habitacionesSeleccionadas })}
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
                <div className="md:hidden h-36" aria-hidden="true" />
            </main>

            <footer className="flex-none border-t border-zinc-200 bg-white px-8 py-5">
                <div className="flex items-center justify-start">
                    <Boton
                        variant="ghost"
                        size="sm"
                        className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
                    <div className={`mb-4 flex items-center gap-3 text-${vinoColor}`}>
                        <div className={`rounded-full bg-${vinoColor}/10 p-2`}>
                            <CheckBadgeIcon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black">{t('booking.existing_client_detected')}</h3>
                    </div>

                    <p className="mb-6 text-sm text-gray-600">{t('booking.existing_client_message')}</p>

                    <div className="flex justify-end gap-3">
                        <Boton variant="secondary">{t('actions.cancel')}</Boton>
                        <Boton className={`bg-${vinoColor} hover:bg-${vinoColor}/90 text-white border-transparent`}>{t('actions.confirm')}</Boton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
