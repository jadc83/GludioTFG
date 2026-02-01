import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4500) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        remove: removeToast,
        clearAll
    };

    return (
        <ToastContext.Provider value={{ toast, toasts, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export default function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider');
    }
    return context.toast;
}

// Export adicional para acceder a los toasts en el container
export function useToasts() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToasts debe usarse dentro de ToastProvider');
    }
    return { toasts: context.toasts, removeToast: context.removeToast };
}

