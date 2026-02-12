import QRScanner from '@/Components/reservas/utilidades/QRScanner';
import { useQRModal } from '@/hooks/scanner/useQRModal';
import { useQRScanner } from '@/hooks/scanner/useQRScanner';
import { t } from '@/i18n';
import {
    formatearFecha,
    formatearHora,
    formatearMoneda,
} from '@/utils/formatters';
import { useState } from 'react';

export default function ReservaInfo({
    reserva,
    total,
    preview,
    onSolicitarReembolso,
    refundRequested = false,
}) {
    const [qrOpen, setQrOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerAction, setScannerAction] = useState(null);

    const { handleScanSuccess } = useQRScanner(scannerAction);
    const { mostrarModal, tipoModal, reservaInfo, abrirModal, cerrarModal } =
        useQRModal();

    const qrData = encodeURIComponent(reserva.localizador || '');
    const qrSizeSmall = 160; // thumbnail
    const qrSizeLarge = 320; // modal (2x)
    const qrUrlSmall = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSizeSmall}x${qrSizeSmall}&data=${qrData}`;
    const qrUrlLarge = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSizeLarge}x${qrSizeLarge}&data=${qrData}`;

    const status = String(reserva?.status || '').toLowerCase();
    const isCheckedIn = status === 'checked_in';
    const isCheckedOut = status === 'checked_out';
    if (!reserva) return null;

    return (
        <>
            <section
                aria-label="Información de la reserva"
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md"
            >
                {/* Cabecera Principal */}
                <div className="border-b border-gray-100 bg-[#7a0202] p-6">
                    <div className="flex items-center justify-between bg-[#7a0202]">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white">
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M3 21h18V7H3v14zM7 10h2v2H7v-2zM11 10h2v2h-2v-2zM15 10h2v2h-2v-2zM7 14h2v2H7v-2zM11 14h2v2h-2v-2zM15 14h2v2h-2v-2z"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M2 7h20"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">
                                    {t('edit_reserva.header_title')}
                                </h3>
                                <p className="text-lg">
                                    <span className="font-mono font-bold uppercase text-white">
                                        {reserva.localizador}
                                    </span>
                                </p>
                            </div>
                        </div>
                        {/* Estado de la reserva dentro del resumen */}
                        <div>
                            <span
                                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                    String(reserva.status || '')
                                        .toLowerCase()
                                        .includes('cancel')
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                }`}
                            >
                                {reserva.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-0">
                    {/* Columna Izquierda: Información Detallada */}
                    <div className="col-span-12 p-6 lg:col-span-8">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Huésped */}
                            <div className="col-span-2">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-200">
                                    <svg
                                        className="h-4 w-4 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M12 12a4 4 0 100-8 4 4 0 000 8zM6 20a6 6 0 0112 0"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>{' '}
                                    <span className="text-white">
                                        {t('edit_reserva.guest_primary')}
                                    </span>
                                </p>
                                <p className="mt-1 text-lg font-bold text-gray-900">
                                    {reserva.reservable?.name ??
                                        reserva.cliente?.name ??
                                        'N/A'}
                                </p>
                                <div className="mt-1 flex gap-3 text-sm text-gray-500">
                                    <span>{reserva.cliente?.email}</span>
                                    {reserva.cliente?.telefono && (
                                        <span>
                                            • {reserva.cliente.telefono}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Fechas */}
                            <div className="rounded-lg border border-gray-100 p-4">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <svg
                                        className="h-4 w-4 text-gray-600"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>{' '}
                                    {t('edit_reserva.checkin_label')}
                                </p>
                                <p className="mt-1 text-base font-bold text-gray-900">
                                    {formatearFecha(reserva.check_in)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {reserva.check_in_time ??
                                        formatearHora(reserva.check_in)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-gray-100 p-4">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <svg
                                        className="h-4 w-4 text-gray-600"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>{' '}
                                    {t('edit_reserva.checkout_label')}
                                </p>
                                <p className="mt-1 text-base font-bold text-gray-900">
                                    {formatearFecha(reserva.check_out)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {reserva.check_out_time ??
                                        formatearHora(reserva.check_out)}
                                </p>
                            </div>

                            {/* Habitaciones */}
                            <div className="col-span-2 mt-2">
                                <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <svg
                                        className="h-4 w-4 text-gray-600"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M3 7h18M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>{' '}
                                    {t('edit_reserva.accommodation_breakdown')}
                                </p>
                                <div className="space-y-3">
                                    {(() => {
                                        const habitacionesArr =
                                            reserva.habitaciones || [];
                                        const sumaAsignados =
                                            habitacionesArr.reduce(
                                                (s, hh) =>
                                                    s + Number(hh.precio ?? 0),
                                                0,
                                            );
                                        const perNightChange = Number(
                                            preview?.per_night_change ?? 0,
                                        );

                                        return habitacionesArr.map((h, i) => {
                                            const tipo =
                                                h.habitacion?.tipo ??
                                                h.tipo ??
                                                'Habitación';
                                            const precioTotalHab = Number(
                                                h.precio ?? 0,
                                            );

                                            // Cálculo de noches
                                            let noches = Number(
                                                reserva.noches || 0,
                                            );
                                            if (
                                                !noches &&
                                                reserva.check_in &&
                                                reserva.check_out
                                            ) {
                                                const ci = new Date(
                                                    reserva.check_in,
                                                );
                                                const co = new Date(
                                                    reserva.check_out,
                                                );
                                                const diff = Math.ceil(
                                                    (co - ci) /
                                                        (1000 * 60 * 60 * 24),
                                                );
                                                noches = diff > 0 ? diff : 0;
                                            }

                                            const precioNoche =
                                                noches > 0
                                                    ? precioTotalHab / noches
                                                    : precioTotalHab;

                                            // Distribución de cambio en preview: calcular total extra para la habitación y promediar por noches nuevas
                                            const extraNights = Number(
                                                preview?.extra_nights ?? 0,
                                            );
                                            let allocatedExtraTotalForRoom = 0;
                                            if (
                                                perNightChange !== 0 &&
                                                extraNights > 0
                                            ) {
                                                if (sumaAsignados > 0) {
                                                    allocatedExtraTotalForRoom =
                                                        perNightChange *
                                                        extraNights *
                                                        (precioTotalHab /
                                                            sumaAsignados);
                                                } else {
                                                    allocatedExtraTotalForRoom =
                                                        (perNightChange *
                                                            extraNights) /
                                                        Math.max(
                                                            1,
                                                            habitacionesArr.length,
                                                        );
                                                }
                                            }

                                            const nightsNew = Number(
                                                preview?.nights_new ?? noches,
                                            );
                                            const precioNocheAjustado =
                                                nightsNew > 0
                                                    ? (precioTotalHab +
                                                          allocatedExtraTotalForRoom) /
                                                      nightsNew
                                                    : precioNoche;
                                            const nochesVisual = nightsNew;

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex justify-between border-b border-gray-50 pb-2 text-gray-700"
                                                >
                                                    <span className="font-medium capitalize">
                                                        {t(
                                                            'edit_reserva.room_format',
                                                            { type: tipo },
                                                        )}
                                                    </span>
                                                    <div className="text-right">
                                                        <div className="font-bold">
                                                            {formatearMoneda(
                                                                precioNocheAjustado,
                                                            )}
                                                            /nt
                                                        </div>
                                                        {nochesVisual > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                {nochesVisual}{' '}
                                                                {t(
                                                                    'paso2.nights',
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Acciones principales */}
                        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
                            {reserva?.localizador ? (
                                <a
                                    href={route(
                                        'reservas.descargar-comprobante',
                                        {
                                            localizador: reserva.localizador,
                                        },
                                    )}
                                    className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-900"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    {t('edit_reserva.download_pdf')}
                                </a>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-bold text-gray-400"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    {t('edit_reserva.download_pdf')}
                                </button>
                            )}

                            <div className="flex gap-2">
                                {!isCheckedIn && !isCheckedOut && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setScannerAction('checkin');
                                                setScannerOpen(true);
                                            }}
                                            className="rounded-lg bg-[#7a0202] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5f0101]"
                                        >
                                            {t('edit_reserva.checkin_button')}
                                        </button>
                                        {reserva?.pago === 'pagado' &&
                                            onSolicitarReembolso && (
                                                <>
                                                    {refundRequested ? (
                                                        <button
                                                            disabled
                                                            className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-400"
                                                        >
                                                            {t(
                                                                'edit_reserva.refund_requested',
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={
                                                                onSolicitarReembolso
                                                            }
                                                            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            {t(
                                                                'edit_reserva.request_refund',
                                                            )}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                    </>
                                )}
                                {isCheckedIn && (
                                    <button
                                        onClick={() => {
                                            setScannerAction('checkout');
                                            setScannerOpen(true);
                                        }}
                                        className="rounded-lg border-2 border-rose-700 px-5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                                    >
                                        Realizar Check-Out
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: QR y Totales */}
                    <div className="col-span-12 border-l border-gray-100 bg-gray-50/30 p-6 lg:col-span-4">
                        <div className="flex flex-col items-center">
                            <div className="mb-6 flex flex-col items-center rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setQrOpen(true)}
                                    className="h-40 w-40 p-0"
                                    aria-label="Abrir QR"
                                >
                                    <img
                                        src={qrUrlSmall}
                                        alt="QR de acceso"
                                        className="h-40 w-40 object-cover"
                                    />
                                </button>
                                <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                                    {t('modal.gallery.quick_pass')}
                                </p>
                            </div>

                            <div className="w-full space-y-4">
                                <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        {t('edit_reserva.rates_and_extras')}
                                    </p>
                                    <div className="space-y-2">
                                        {(() => {
                                            const tarifasArr = reserva.tarifas
                                                ?.length
                                                ? reserva.tarifas
                                                : reserva.tarifa
                                                  ? [reserva.tarifa]
                                                  : [];
                                            if (tarifasArr.length) {
                                                return tarifasArr.map(
                                                    (t, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex justify-between text-sm text-gray-600"
                                                        >
                                                            <span>
                                                                {t.name ??
                                                                    t.nombre}
                                                            </span>
                                                            <span className="font-medium text-gray-900">
                                                                {t.price
                                                                    ? formatearMoneda(
                                                                          Number(
                                                                              t.price,
                                                                          ),
                                                                      )
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                    ),
                                                );
                                            }
                                            return (
                                                <p className="text-xs italic text-gray-400">
                                                    {t(
                                                        'edit_reserva.no_additional_charges',
                                                    )}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-gray-200 pt-4">
                                    <div className="mt-2">
                                        <div className="flex w-full items-end justify-between">
                                            <span className="text-sm font-bold uppercase text-gray-900">
                                                {t('edit_reserva.total_final')}
                                            </span>
                                            <span className="rounded-md bg-black px-3 py-1 text-2xl font-black tracking-tight text-white">
                                                {formatearMoneda(
                                                    Number(
                                                        reserva.precio_total ??
                                                            total ??
                                                            0,
                                                    ),
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex justify-end">
                                            <span
                                                role="status"
                                                className={`inline-flex select-none items-center justify-center rounded-full border-2 px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${
                                                    reserva?.pago === 'pagado'
                                                        ? 'rotate-3 border-green-700 bg-green-50/60 text-green-700'
                                                        : '-rotate-3 border-amber-700 bg-amber-50/60 text-amber-700'
                                                }`}
                                            >
                                                {reserva?.pago === 'pagado'
                                                    ? t('edit_reserva.paid')
                                                    : t('edit_reserva.pending')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {qrOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        aria-label="Cerrar"
                        className="absolute inset-0 h-full w-full bg-transparent p-0"
                        onClick={() => setQrOpen(false)}
                    />
                    <div className="mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
                        <div className="flex items-center justify-between bg-[#7a0202] p-4">
                            <h4 className="font-bold text-white">
                                Pase de acceso rápido
                            </h4>
                            <button
                                onClick={() => setQrOpen(false)}
                                aria-label="Cerrar"
                                className="text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex items-center justify-center p-6">
                            <img
                                src={qrUrlLarge}
                                alt="QR ampliado"
                                className="h-80 w-80 object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}

            {mostrarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                    <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
                        <div className="flex items-center justify-between bg-[#7a0202] p-4">
                            <div />
                            <button
                                onClick={cerrarModal}
                                className="text-white hover:opacity-90"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            {tipoModal === 'checkin' && (
                                <>
                                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <svg
                                            className="h-6 w-6"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M5 13l4 4L19 7"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="mt-2 text-2xl font-bold">
                                        ¡Bienvenido!
                                    </h2>
                                    <p className="mt-2 text-gray-700">
                                        La reserva{' '}
                                        <span className="font-mono">
                                            {reservaInfo?.localizador}
                                        </span>{' '}
                                        ha sido marcada como{' '}
                                        <strong>check-in</strong>.
                                    </p>
                                    <p className="mt-2 text-gray-600">
                                        ¡Que disfrute su estancia!
                                    </p>

                                    {reservaInfo?.asignaciones &&
                                        reservaInfo.asignaciones.filter(
                                            (a) => a.assigned,
                                        ).length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-bold text-gray-700">
                                                    Habitación(es) asignada(s)
                                                </p>
                                                <div className="mt-2 flex flex-wrap justify-center gap-3">
                                                    {reservaInfo.asignaciones
                                                        .filter(
                                                            (a) => a.assigned,
                                                        )
                                                        .map((a, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium"
                                                            >
                                                                Habitación{' '}
                                                                {a.numero ??
                                                                    a.habitacion_id}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                </>
                            )}

                            {tipoModal === 'checkout' && (
                                <>
                                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                                        <svg
                                            className="h-6 w-6"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M10 9l6 6M16 9l-6 6"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="mt-2 text-2xl font-bold">
                                        ¡Hasta pronto!
                                    </h2>
                                    <p className="mt-2 text-gray-700">
                                        La reserva{' '}
                                        <span className="font-mono">
                                            {reservaInfo?.localizador}
                                        </span>{' '}
                                        ha sido marcada como{' '}
                                        <strong>check-out</strong>.
                                    </p>
                                    <p className="mt-2 text-gray-600">
                                        Gracias por su visita.
                                    </p>
                                </>
                            )}

                            {tipoModal === 'success' && (
                                <>
                                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <svg
                                            className="h-6 w-6"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M5 13l4 4L19 7"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="mt-2 text-2xl font-bold">
                                        ¡Reserva encontrada!
                                    </h2>
                                    <p className="mt-2 text-gray-700">
                                        Se ha encontrado la reserva{' '}
                                        <span className="font-mono">
                                            {reservaInfo?.localizador}
                                        </span>
                                        .
                                    </p>
                                    <p className="mt-2 text-gray-600">
                                        Haga clic en continuar para ver los
                                        detalles.
                                    </p>
                                </>
                            )}

                            <div className="mt-6">
                                <button
                                    onClick={cerrarModal}
                                    className="rounded-lg bg-[#7a0202] px-4 py-2 font-bold text-white"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {scannerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-28"
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        aria-label="Cerrar"
                        className="absolute inset-0 h-full w-full bg-transparent p-0"
                        onClick={() => setScannerOpen(false)}
                    />
                    <div className="mx-4 w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
                        <div className="flex items-center justify-between bg-[#7a0202] p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white">
                                    <svg
                                        className="h-6 w-6"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M3 7h18M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    Escanear código QR
                                </h3>
                            </div>
                            <button
                                onClick={() => setScannerOpen(false)}
                                className="text-white hover:opacity-90"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600">
                                Acerca el código QR al recuadro. El escáner
                                detectará el código automáticamente.
                            </p>
                            <ul className="mt-2 list-inside list-disc text-xs text-gray-500">
                                <li>
                                    Sujeta el dispositivo firme y evita reflejos
                                    en el código.
                                </li>
                            </ul>
                            <div className="mt-4 overflow-hidden rounded-md border-2 border-dashed border-gray-200">
                                <QRScanner
                                    onScanSuccess={async (decoded) => {
                                        const result =
                                            await handleScanSuccess(decoded);
                                        if (result && result.type === 'modal') {
                                            setScannerOpen(false);
                                            abrirModal(
                                                result.tipoModal,
                                                result.reservaInfo,
                                            );
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
