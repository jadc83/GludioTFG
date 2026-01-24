import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';

export default function ScanResult() {
    const page = usePage();
    const localizador = page.props.localizador ?? (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('localizador') || new URLSearchParams(window.location.search).get('q')) : '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const csrf = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') : null;

    const handleCheckIn = async () => {
        if (!localizador) return setMessage('No hay localizador para hacer check-in');
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`/reservas/${encodeURIComponent(localizador)}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf || '', 'Accept': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({}),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || 'Error al realizar check-in');
            setMessage(body.message || 'Check-in realizado');
        } catch (err) {
            console.error('Check-in error', err);
            setMessage(err.message || 'Error realizando check-in');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-semibold mb-4">Resultado del escaneo</h1>
            <p className="mb-6">Localizador: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{localizador || '—'}</span></p>
            {message && <div className="mb-4 rounded-lg bg-indigo-50 p-4 text-indigo-700">{message}</div>}
            <div className="flex gap-4">
                <button disabled={loading} onClick={handleCheckIn} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{loading ? 'Procesando...' : 'Hacer check-in'}</button>
                <button onClick={() => router.visit(route('scan-qr'))} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">Escanear de nuevo</button>
                <a href={localizador ? route('reserva.show', { reserva: localizador }) : '#'} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Detalles</a>
            </div>
        </div>
    );
}
