import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useToasts } from '@/hooks/useToast.jsx';

export default function ToastContainer() {
    const { toasts, removeToast } = useToasts();

    return (
        <div className="fixed top-20 right-6 z-[99999] space-y-3 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
}

function Toast({ toast, onRemove }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, toast.duration || 4500);

        return () => clearTimeout(timer);
    }, [toast.id]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove(toast.id);
        }, 300);
    };

    const getConfig = () => {
        switch (toast.type) {
            case 'success':
                return {
                    icon: CheckCircleIcon,
                    bgColor: 'bg-gris',
                    borderColor: 'border-[#920303]',
                    textColor: 'text-gray-800',
                    iconColor: 'text-emerald-600',
                    progressColor: 'bg-emerald-500'
                };
            case 'error':
                return {
                    icon: XCircleIcon,
                    bgColor: 'bg-gris',
                    borderColor: 'border-[#920303]',
                    textColor: 'text-gray-800',
                    iconColor: 'text-[#920303]',
                    progressColor: 'bg-[#920303]'
                };
            case 'warning':
                return {
                    icon: ExclamationTriangleIcon,
                    bgColor: 'bg-gris',
                    borderColor: 'border-[#920303]',
                    textColor: 'text-gray-800',
                    iconColor: 'text-amber-600',
                    progressColor: 'bg-amber-500'
                };
            default: // info
                return {
                    icon: InformationCircleIcon,
                    bgColor: 'bg-gris',
                    borderColor: 'border-[#920303]',
                    textColor: 'text-gray-800',
                    iconColor: 'text-blue-600',
                    progressColor: 'bg-blue-500'
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <div
            className={`
                pointer-events-auto
                ${config.bgColor} ${config.borderColor} ${config.textColor}
                border-l-4 rounded-2xl shadow-lg
                p-4 pr-12 min-w-[320px] max-w-md
                transform transition-all duration-300 ease-out
                ${isExiting
                    ? 'translate-x-[400px] opacity-0'
                    : 'translate-x-0 opacity-100 animate-in slide-in-from-right'
                }
            `}
        >
            <div className="flex items-start gap-3">
                <Icon className={`h-6 w-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-relaxed break-words">
                        {toast.message}
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className={`
                        ${config.iconColor} hover:opacity-70
                        transition-opacity flex-shrink-0
                        p-1 -mr-2 -mt-1 rounded-lg
                        hover:bg-black/5
                    `}
                    aria-label="Cerrar"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Barra de progreso */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 rounded-b-2xl overflow-hidden">
                <div
                    className={`h-full ${config.progressColor} rounded-b-2xl transition-all ease-linear`}
                    style={{
                        width: '100%',
                        animation: `shrink ${toast.duration || 4500}ms linear forwards`
                    }}
                />
            </div>

            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
