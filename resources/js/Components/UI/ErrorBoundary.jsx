import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            stack: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // capture stack for UI
        try {
            this.setState({
                stack: info?.componentStack || (error && error.stack) || null,
            });
        } catch (e) {
            /* ignore */
        }
        console.error('ErrorBoundary caught an error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="rounded border border-rose-100 bg-rose-50 p-4 text-rose-700">
                    <div className="mb-2 font-semibold">
                        Error cargando esta sección
                    </div>
                    <div className="mb-3 text-xs">
                        Algo falló al cargar el contenido. Intenta recargar la
                        página o contacta con soporte.
                    </div>
                    <button
                        className="mb-2 text-xs underline"
                        onClick={() =>
                            this.setState((s) => ({
                                showDetails: !s.showDetails,
                            }))
                        }
                    >
                        {this.state.showDetails
                            ? 'Ocultar detalles'
                            : 'Mostrar detalles'}
                    </button>
                    {this.state.showDetails && (
                        <pre
                            className="mt-2 overflow-auto rounded border border-rose-100 bg-white p-2 text-xs text-rose-700"
                            style={{ maxHeight: 240 }}
                        >
                            <code>
                                {(this.state.error &&
                                    (this.state.error.message ||
                                        String(this.state.error))) ||
                                    'Sin mensaje'}
                            </code>
                            <div className="mt-2 whitespace-pre-wrap text-xs text-rose-600">
                                {this.state.stack || 'Sin stack disponible'}
                            </div>
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
