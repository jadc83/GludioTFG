import { useEffect, useState, useRef } from 'react';

export default function Toast({ duration: defaultDuration = 4500, onClose, }) {
    const [visible, setVisible] = useState(false);
    const [payload, setPayload] = useState({ message: null, tipo: 'info', duration: defaultDuration });
    const timerRef = useRef(null);

    const show = (msg, tipo = 'info', dur = defaultDuration) => {
        if (!msg) return;
        setPayload({ message: msg, tipo: tipo || 'info', duration: dur || defaultDuration });
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setVisible(false);
            setPayload({ message: null, tipo: 'info', duration: defaultDuration });
            if (typeof onClose === 'function') onClose();
        }, dur || defaultDuration);
    };

    useEffect(() => {
        // Listen for global toasts only
        const handler = (e) => {
            const d = e?.detail || {};
            // Debug suspicious short messages: print stack to see where dispatch came from
            if (typeof d.message === 'string' && d.message.length <= 1) {
                console.warn('DEBUG: app-toast with short message', { detail: d, stack: new Error().stack });
            }
            show(d.message, d.type || d.tipo || 'info', d.duration ?? defaultDuration);
        };
        window.addEventListener('app-toast', handler);
        return () => {
            window.removeEventListener('app-toast', handler);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [defaultDuration, onClose]);

    if (!visible || !payload.message) return null;

    // Map background color by toast type: error -> black, success -> green, others -> burgundy
    const bg = payload.tipo === 'error' ? 'bg-black' : payload.tipo === 'success' ? 'bg-green-600' : 'bg-[#6b021c]';

    return (
        <div className="fixed right-4 top-4 z-50">
            <div className={`${bg} flex items-center rounded px-4 py-2 text-white shadow-lg`}>
                <div className="mr-3">{payload.message}</div>
                {payload.action && payload.action.label && (
                    <button
                        onClick={() => {
                            // Dispatch a global action event with action payload
                            window.dispatchEvent(new CustomEvent('app-toast-action', { detail: payload.action }));
                            setVisible(false);
                            setPayload({ message: null, tipo: 'info', duration: defaultDuration });
                            if (typeof onClose === 'function') onClose();
                        }}
                        className="ml-2 mr-2 bg-white text-[#6b021c] rounded px-3 py-1 text-xs font-semibold"
                    >
                        {payload.action.label}
                    </button>
                )}
                <button
                    onClick={() => {
                        setVisible(false);
                        setPayload({ message: null, tipo: 'info', duration: defaultDuration });
                        if (typeof onClose === 'function') onClose();
                    }}
                    className="ml-2 text-white opacity-90 hover:opacity-100 focus:outline-none"
                    aria-label="Cerrar"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
