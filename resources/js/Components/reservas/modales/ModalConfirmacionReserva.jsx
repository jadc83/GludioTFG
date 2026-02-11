import { formatearMoneda } from '@/utils/formatters';
import { useEffect, useState } from 'react';

export default function ModalConfirmacionReserva({ reserva, isOpen, onClose }) {
    const [animarSalida, setAnimarSalida] = useState(false);

    useEffect(() => {
        if (!isOpen) setAnimarSalida(false);
    }, [isOpen]);

    const handleClose = () => {
        setAnimarSalida(true);
        setTimeout(onClose, 300);
    };

    if (!isOpen || !reserva) return null;

    return (
        <>
            {/* Overlay - Desenfoque sutil para centrar la atención */}
            <div
                className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${animarSalida ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
                role="presentation"
                aria-hidden="true"
            />

            {/* Modal Wrapper */}
            <div
                className={`fixed left-1/2 top-1/2 z-[70] w-[90%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${animarSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-confirmacion-title"
            >
                <div
                    className="overflow-hidden rounded-2xl bg-white shadow-2xl"
                    role="document"
                >
                    {/* Header - Estilo "Success" Limpio */}
                    <div className="border-b border-gray-100 bg-gray-50 px-6 py-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2
                            id="modal-confirmacion-title"
                            className="text-lg font-bold text-gray-900"
                        >
                            ¡Reserva Confirmada!
                        </h2>
                        <p className="mt-1 text-xs font-medium text-gray-500">
                            {reserva.pagoAlLlegar
                                ? 'Pago pendiente en recepción'
                                : 'Pago procesado con éxito'}
                        </p>
                    </div>

                    {/* Content - Formato Ticket */}
                    <div className="space-y-6 p-6">
                        {/* Localizador destacado */}
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Localizador
                            </p>
                            <p className="mt-1 font-mono text-2xl font-black tracking-tighter text-gray-900">
                                {reserva.localizador}
                            </p>
                        </div>

                        {/* Grid de detalles con divisores */}
                        <div className="grid grid-cols-2 gap-y-4 border-y border-dashed border-gray-200 py-4">
                            <div className="border-r border-gray-100 text-center">
                                <p className="text-[9px] font-bold uppercase text-gray-400">
                                    Check-in
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {new Date(
                                        reserva.check_in,
                                    ).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                    })}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-bold uppercase text-gray-400">
                                    Check-out
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {new Date(
                                        reserva.check_out,
                                    ).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                    })}
                                </p>
                            </div>
                            <div className="border-r border-gray-100 text-center">
                                <p className="text-[9px] font-bold uppercase text-gray-400">
                                    Huésped
                                </p>
                                <p className="truncate px-2 text-xs font-medium text-gray-700">
                                    {reserva.nombre}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-bold uppercase text-gray-400">
                                    Habitaciones
                                </p>
                                <p className="text-xs font-medium text-gray-700">
                                    {reserva.cantidad_habitaciones}
                                </p>
                            </div>
                        </div>

                        {/* Importe Final */}
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold uppercase text-gray-500">
                                {reserva.pagoAlLlegar
                                    ? 'Total a pagar'
                                    : 'Total pagado'}
                            </span>
                            <span className="text-xl font-black text-[#7a0202]">
                                {formatearMoneda(reserva.precio_total)}
                            </span>
                        </div>

                        {/* Info de Pago / Correo */}
                        <div
                            className={`rounded-xl border p-3 text-center ${reserva.pagoAlLlegar ? 'border-amber-100 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}
                        >
                            {reserva.pagoAlLlegar ? (
                                <p className="text-[11px] font-medium leading-tight text-amber-800">
                                    Recuerda presentar este localizador al
                                    llegar al hotel para formalizar el pago.
                                </p>
                            ) : (
                                <p className="text-[11px] font-medium leading-tight text-emerald-800">
                                    Hemos enviado los detalles y el comprobante
                                    de pago a tu correo electrónico.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer - Acción Principal */}
                    <div className="bg-gray-50 p-4 text-center">
                        <button
                            aria-label="Finalizar y volver al inicio"
                            onClick={() => {
                                setAnimarSalida(true);
                                setTimeout(() => {
                                    router.visit('/');
                                }, 300);
                            }}
                            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-all hover:bg-black hover:shadow-lg active:scale-95"
                        >
                            Finalizar y Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
