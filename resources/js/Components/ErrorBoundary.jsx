import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Log to console for now; backend logging could be added
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="mb-2 rounded-md border-l-4 border-red-600 bg-red-50 p-6">
                    <strong className="block text-sm font-black text-red-800">
                        Error cargando el formulario de pago
                    </strong>
                    <p className="mt-2 text-xs text-red-700">
                        {String(this.state.error?.message || this.state.error)}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        Abre la consola (F12) y pega aquí el error si necesitas
                        ayuda.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}
