import { useEffect, useState } from 'react';

export default function Toast({
    message,
    tipo = 'info',
    duration = 4500,
    onClose,
}) {
    const [visible, setVisible] = useState(!!message);

    useEffect(() => {
        setVisible(!!message);
        if (!message) return;
        const t = setTimeout(() => {
            setVisible(false);
            if (typeof onClose === 'function') onClose();
        }, duration);
        return () => clearTimeout(t);
    }, [message, duration, onClose]);

    if (!visible || !message) return null;

    const bg = tipo === 'error' ? 'bg-red-600' : 'bg-indigo-600';

    return (
        <div className="fixed right-4 top-4 z-50">
            <div
                className={`${bg} flex items-center rounded px-4 py-2 text-white shadow-lg`}
            >
                <div className="mr-3">{message}</div>
                <button
                    onClick={() => typeof onClose === 'function' && onClose()}
                    className="ml-2 text-white opacity-90 hover:opacity-100 focus:outline-none"
                    aria-label="Cerrar"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
