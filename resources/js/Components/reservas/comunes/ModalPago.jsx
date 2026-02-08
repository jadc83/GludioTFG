import ErrorBoundary from '@/Components/ErrorBoundary';
import FormularioPago from '@/Components/formularios/create/FormularioPago';
import { formatearMoneda } from '@/utils/formatters';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

export default function ModalPago({
    mostrar,
    monto,
    onCerrar,
    onPagoExitoso,
    onError,
    reservaData,
    aceptaTerminos,
    mostrarAceptacion,
    onCambioAceptaTerminos,
}) {
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    if (!mostrar) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <div className="animate-in zoom-in w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl duration-200">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase leading-tight text-gray-900">Pago Adicional</h2>
                        <p className="mt-1 text-sm font-medium text-gray-400">Se requiere saldar la diferencia para aplicar cambios.</p>
                    </div>
                    <button onClick={onCerrar} className="font-bold text-gray-300 hover:text-gray-500">✕</button>
                </div>

                <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total a pagar ahora</span>
                    <div className="mt-1 text-4xl font-black text-[#7a0202]">{formatearMoneda(monto)}</div>
                </div>

                <ErrorBoundary>
                    <FormularioPago
                        monto={monto}
                        onPagoExitoso={onPagoExitoso}
                        onError={onError}
                        reservaData={reservaData}
                        aceptaTerminos={aceptaTerminos}
                        mostrarAceptacion={mostrarAceptacion}
                        onCambioAceptaTerminos={onCambioAceptaTerminos}
                    />
                </ErrorBoundary>

                <div className="mt-6 space-y-3">
                    <button onClick={onCerrar} className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:text-gray-600">Cancelar operación</button>
                </div>
            </div>
        </div>
    );
}
