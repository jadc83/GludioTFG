import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import QRScanner from '@/Components/QRScanner';

export default function ScanQR() {
    const [scannedData, setScannedData] = useState(null);
    const [error, setError] = useState(null);

    const handleScanSuccess = useCallback((decodedText) => {
        // Limpiar espacios en blanco
        const localizador = decodedText.trim();

        if (!localizador) {
            setError('QR inválido');
            return;
        }

        // Redirigir al show de la reserva
        router.visit(route('reserva.show', { reserva: localizador }));
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

                    {scannedData && (
                        <div className="mb-8 rounded-lg bg-green-50 p-6 shadow-lg">
                            <h2 className="mb-4 text-xl font-semibold text-green-900">Código QR Detectado</h2>
                            <div className="mb-4 break-all rounded-lg bg-white p-4 font-mono text-sm text-slate-700">{scannedData}</div>
                            <button onClick={() => setScannedData(null)} className="rounded-lg px-4 py-2 font-semibold">
                                Limpiar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
