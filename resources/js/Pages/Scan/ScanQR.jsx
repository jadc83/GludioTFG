import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import QRScanner from '@/Components/utilidades/QRScanner';

export default function ScanQR() {
    const [scannedData, setScannedData] = useState(null);
    const [error, setError] = useState(null);

    const handleScanSuccess = useCallback((decodedText) => {
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

        fetch(`/reservas/buscar/${encodeURIComponent(localizador)}`, { headers: { 'Accept': 'application/json' } })
            .then(async (res) => {
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.error || 'Reserva no encontrada');
                }
                return res.json();
            })
            .then((data) => {
                if (data?.reserva) {
                    router.visit(route('scan-result') + '?localizador=' + encodeURIComponent(localizador));
                } else {
                    setError('No se encontró la reserva asociada al código QR.');
                }
            })
            .catch((err) => {
                setError(err.message || 'No se encontró la reserva');
            });
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
                            <button onClick={() => setScannedData(null)} className="rounded-lg px-4 py-2 font-semibold">Limpiar</button>
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
