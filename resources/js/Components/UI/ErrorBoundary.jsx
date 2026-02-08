import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, stack: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // capture stack for UI
        try {
            this.setState({ stack: info?.componentStack || (error && error.stack) || null });
        } catch (e) { /* ignore */ }
        console.error('ErrorBoundary caught an error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-rose-50 rounded border border-rose-100 text-rose-700">
                    <div className="font-semibold mb-2">Error cargando esta sección</div>
                    <div className="text-xs mb-3">Algo falló al cargar el contenido. Intenta recargar la página o contacta con soporte.</div>
                    <button className="text-xs underline mb-2" onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}>
                        {this.state.showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
                    </button>
                    {this.state.showDetails && (
                        <pre className="mt-2 text-xs overflow-auto rounded p-2 bg-white text-rose-700 border border-rose-100" style={{ maxHeight: 240 }}>
                            <code>{(this.state.error && (this.state.error.message || String(this.state.error))) || 'Sin mensaje'}</code>
                            <div className="mt-2 text-xs text-rose-600 whitespace-pre-wrap">{this.state.stack || 'Sin stack disponible'}</div>
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
