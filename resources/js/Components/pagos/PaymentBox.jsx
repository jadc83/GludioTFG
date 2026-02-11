import React from 'react';
import CardConfirmForm from '@/Components/pagos/CardConfirmForm';
import { formatearMoneda } from '@/utils/formatters';

export default function PaymentBox({ clientSecret, paymentIntentId, reserva, amount, name, email, onConfirmed, onError }) {
    return (
        <div className="w-full max-w-xl mx-auto p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-extrabold text-gray-900">Completar pago</h3>
                    <p className="mt-1 text-sm text-gray-500">Introduce los datos de la tarjeta para procesar el cobro seguro.</p>
                    {typeof amount === 'number' && (
                        <div className="mt-2 text-sm text-gray-700">Importe a cargar: <span className="font-bold">{formatearMoneda(amount)}</span></div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <CardConfirmForm
                    clientSecret={clientSecret}
                    paymentIntentId={paymentIntentId}
                    name={name || reserva?.reservable?.name}
                    email={email || reserva?.reservable?.email}
                    onSuccess={(data) => {
                        console.log('--- [PaymentBox] onSuccess data:', data);
                        onConfirmed && onConfirmed(data);
                    }}
                    onError={onError}
                />
            </div>
        </div>
    );
}
