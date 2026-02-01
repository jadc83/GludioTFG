import { useCallback } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import QRScanner from '@/Components/utilidades/QRScanner';
import { CheckCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useQRScanner } from '@/hooks/scanner/useQRScanner';
import { useQRModal } from '@/hooks/scanner/useQRModal';

export default function ScanQR() {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const action = params.get('action') || null;

    const { scannedData, error, assignDetails, isProcessing, handleScanSuccess } = useQRScanner(action);
    const { showModal, modalType, reservaInfo, openModal, closeModal } = useQRModal();

    const handleScanSuccessWithModal = useCallback(async (decodedText) => {
        const result = await handleScanSuccess(decodedText);
        if (result?.type === 'modal') {
            openModal(result.modalType, result.reservaInfo);
        }
    }, [handleScanSuccess, openModal]);

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {error && (
                        <div className="mb-8 rounded-lg bg-red-100 p-6 shadow-lg">
                            <h2 className="mb-4 text-xl font-semibold text-red-900">Error</h2>
                            <p className="text-red-700">{error}</p>
                            {assignDetails && assignDetails.length > 0 && (
                                <div className="mt-4 text-left text-sm text-red-700">
                                    <h3 className="font-semibold mb-2">Detalles de asignación:</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {assignDetails.map((d) => (
                                            <li key={d.placeholder_id}>
                                                {d.assigned ? `Asignada habitación ${d.habitacion_id} (placeholder ${d.placeholder_id})` : `Placeholder ${d.placeholder_id}: No disponible (${d.reason || 'desconocido'})`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
                        <QRScanner onScanSuccess={handleScanSuccessWithModal} />
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

                                {modalType === 'success' && (
                                    <>
                                        <CheckCircleIcon className="mx-auto h-16 w-16 text-blue-500" />
                                        <h2 className="text-2xl font-bold mt-4">¡Reserva encontrada!</h2>
                                        <p className="mt-2 text-gray-700">Se ha encontrado la reserva <span className="font-mono">{reservaInfo?.localizador}</span>.</p>
                                        <p className="mt-2 text-gray-600">Haga clic en continuar para ver los detalles.</p>
                                    </>
                                )}

                                <div className="mt-6">
                                    <button onClick={closeModal} className="px-4 py-2 bg-[#7a0202] text-white rounded">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
