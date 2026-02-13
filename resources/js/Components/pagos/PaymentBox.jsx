import CardConfirmForm from '@/Components/pagos/CardConfirmForm';
import { formatearMoneda } from '@/utils/formatters';

export default function PaymentBox({
    clientSecret,
    paymentIntentId,
    reserva,
    amount,
    name,
    email,
    onConfirmed,
    onError,
}) {
    return (
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                        Completar pago
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Introduce los datos de la tarjeta para procesar el cobro
                        seguro.
                    </p>
                    {typeof amount === 'number' && (
                        <div className="mt-2 text-sm text-gray-700">
                            Importe a cargar:{' '}
                            <span className="font-bold">
                                {formatearMoneda(amount)}
                            </span>
                        </div>
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
                        onConfirmed && onConfirmed(data);
                    }}
                    onError={onError}
                />
            </div>
        </div>
    );
}
