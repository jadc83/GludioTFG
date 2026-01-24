import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import QRScanner from '@/Components/utilidades/QRScanner';
import { CheckCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function ScanQR() {
    const [scannedData, setScannedData] = useState(null);
    const [error, setError] = useState(null);
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const action = params.get('action') || null;

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [reservaInfo, setReservaInfo] = useState(null);

    const handleCloseModal = () => {
        setShowModal(false);
        if (modalType === 'checkin') {
            router.visit(route('reserva.show', { reserva: reservaInfo?.localizador || '' }));
        } else if (modalType === 'checkout') {
            router.visit(route('home'));
        }
    };

    const handleScanSuccess = useCallback(async (decodedText) => {
        setError(null);
        let localizador = String(decodedText || '').trim();
        if (!localizador) return;

        setScannedData(localizador);

        try {
            if (localizador.startsWith('http')) {
                const url = new URL(localizador);
                const parts = url.pathname.split('/').filter(Boolean);
                if (parts.length > 0) {
                    localizador = parts[parts.length - 1];
                }
            }
        } catch (e) {}

        // Obtener CSRF token para los POST (si está presente)
        const csrf = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') : null;

        try {
            const payload = { localizador: localizador };
            if (action) payload.action = action;

            const res = await fetch(route('scan.procesar'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf || '', 'Accept': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(body?.error || 'Error procesando escaneo');
                return;
            }

            // Si la respuesta incluye 'reserva' con status, mostrar modal o redirigir según action
            const respReserva = body?.reserva || null;
            setReservaInfo(respReserva);

            if (action === 'checkin') {
                setModalType('checkin');
                setShowModal(true);
                return;
            }

            if (action === 'checkout') {
                setModalType('checkout');
                setShowModal(true);
                return;
            }

            // Sin acción: ir al detalle
            router.visit(route('reserva.show', { reserva: localizador }));
            return;
        } catch (e) {
            console.error('Error procesando la reserva:', e);
            setError('Error procesando la reserva');
        }
    }, []);

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {error && (
                        <div className="mb-8 rounded-lg bg-red-100 p-6 shadow-lg">
                            <h2 className="mb-4 text-xl font-semibold text-red-900">Error</h2>
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
                        <QRScanner onScanSuccess={handleScanSuccess} />
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black opacity-50"></div>
                            <div className="relative max-w-lg w-full bg-white rounded-lg p-6 shadow-lg text-center">
                                {modalType === 'checkin' && (
                                    <>
                                        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
                                        <h2 className="text-2xl font-bold mt-4">¡Bienvenido!</h2>
                                        <p className="mt-2 text-gray-700">La reserva <span className="font-mono">{reservaInfo?.localizador}</span> ha sido marcada como <strong>check-in</strong>.</p>
                                        <p className="mt-2 text-gray-600">¡Que disfrute su estancia!</p>
                                    </>
                                )}

                                {modalType === 'checkout' && (
                                    <>
                                        <ArrowRightOnRectangleIcon className="mx-auto h-16 w-16 text-yellow-600" />
                                        <h2 className="text-2xl font-bold mt-4">¡Hasta pronto!</h2>
                                        <p className="mt-2 text-gray-700">La reserva <span className="font-mono">{reservaInfo?.localizador}</span> ha sido marcada como <strong>check-out</strong>.</p>
                                        <p className="mt-2 text-gray-600">Gracias por su visita.</p>
                                    </>
                                )}

                                <div className="mt-6">
                                    <button onClick={handleCloseModal} className="px-4 py-2 bg-[#7a0202] text-white rounded">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Se ha eliminado la visualización del contenido del QR: solo se muestra la cámara */}
                </div>
            </div>
        </GuestLayout>
    );
}
