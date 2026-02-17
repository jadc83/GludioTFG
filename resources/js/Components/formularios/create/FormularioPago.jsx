import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { usePage } from '@inertiajs/react';
import CardConfirmForm from '@/Components/pagos/CardConfirmForm';
import Campo from '@/Components/reservas/utilidades/Campo';
import useFormularioPago from '@/hooks/reservas/useFormularioPago';
import ClienteExistenteModal from '@/Components/formularios/create/ClienteExistenteModal';
import PaymentButton from '@/Components/formularios/create/PaymentButton';

export default function FormularioPago(props) {
    const page = usePage();
    const user = page?.props?.auth?.user;

    const {
        procesando,
        mensaje,
        acepta,
        fieldErrors,
        debugErrorJson,
        piClientSecret,
        piPaymentIntentId,
        showCardForm,
        clienteExistente,
        showClienteModal,
        isDisabled,
        name,
        email,
        telefono,
        nameRef,
        emailRef,
        telefonoRef,
        stripePromise,
        setName,
        setEmail,
        setTelefono,
        setAcepta,
        setShowCardForm,
        setProcesando,
        startCheckout,
        retryUsingExistingClient,
        editClientDocument,
        setShowClienteModal,
        setMensaje,
    } = useFormularioPago(props);

    const { reservaData = {}, monto = 0, mostrarAceptacion = false, onPagoExitoso, onCambioAceptaTerminos } = props;

    return (
        <div className="relative mx-auto w-full bg-gris px-2">
            <ClienteExistenteModal
                show={showClienteModal}
                cliente={clienteExistente}
                onClose={() => setShowClienteModal(false)}
                onRetry={retryUsingExistingClient}
                onEdit={editClientDocument}
            />

            <div role="form" aria-busy={procesando ? 'true' : 'false'} className="w-full space-y-6">
                <div className="space-y-4">
                    {!reservaData?.name && (
                        <div>
                            <Campo
                                id="name"
                                label="Titular de la tarjeta"
                                ref={nameRef}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nombre completo"
                                error={fieldErrors['name']}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {!reservaData?.email && (
                            <div>
                                <Campo
                                    id="email"
                                    label="Email"
                                    ref={emailRef}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email de contacto"
                                    error={fieldErrors['email']}
                                />
                            </div>
                        )}

                        {!reservaData?.telefono && (
                            <div>
                                <Campo
                                    id="telefono"
                                    label="Teléfono"
                                    ref={telefonoRef}
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    placeholder="Teléfono"
                                    error={fieldErrors['telefono']}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {mostrarAceptacion && (
                        <label
                            onClick={(e) => e.stopPropagation()}
                            className="group flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={acepta}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    setAcepta(e.target.checked);
                                    onCambioAceptaTerminos?.(e.target.checked);
                                }}
                                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 text-black focus:ring-black pointer-events-auto"
                            />
                            <span className="text-[10px] font-bold uppercase leading-relaxed tracking-tight text-gray-500 transition-colors group-hover:text-gray-700">
                                He leído y acepto los{' '}
                                <span className="text-gray-900 underline decoration-black decoration-2 underline-offset-4">términos y condiciones</span>, así como la política de cancelación.
                            </span>
                        </label>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                                {!user && (
                                    <div className="mb-2 rounded border border-yellow-100 bg-yellow-50 p-3 text-xs text-yellow-800">
                                        Pago con tarjeta deshabilitado para usuarios no registrados. Inicia sesión o crea una cuenta para pagar con tarjeta.
                                    </div>
                                )}

                                {/* Mostrar directamente el formulario de tarjeta y usar startCheckout como preparador */}
                                {stripePromise && user ? (
                                    <div className="mt-2">
                                        <Elements key={piClientSecret || 'no-secret'} stripe={stripePromise} options={piClientSecret ? { clientSecret: piClientSecret } : {}}>
                                            <CardConfirmForm
                                                clientSecret={piClientSecret}
                                                paymentIntentId={piPaymentIntentId}
                                                name={name}
                                                email={email}
                                                localizador={reservaData?.localizador}
                                                onCompleted={(data) => {
                                                        if (typeof onPagoExitoso === 'function') onPagoExitoso(data);
                                                        setShowCardForm(false);
                                                        setProcesando(false);
                                                    }}
                                                onError={(msg) => setMensaje(msg)}
                                                onPrepare={startCheckout}
                                                acepta={acepta}
                                                requireAcceptance={mostrarAceptacion || typeof onCambioAceptaTerminos === 'function'}
                                            />
                                        </Elements>
                                    </div>
                                ) : (
                                    <PaymentButton onClick={startCheckout} isDisabled={isDisabled} procesando={procesando} />
                                )}
                            </div>
                    </div>

                            {/* Nota: CardConfirmForm se monta una sola vez abajo; el onPrepare
                                creará PaymentIntent/reserva si hace falta. */}
                </div>

                {debugErrorJson && (
                    <div className="mb-2 rounded-md bg-gray-900 p-3 text-white">
                        <div className="flex items-center justify-between">
                            <strong className="text-sm">Debug: respuesta de validación (422)</strong>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => navigator.clipboard?.writeText(debugErrorJson)} className="text-xs underline">Copiar</button>
                                <button type="button" onClick={() => setDebugErrorJson(null)} className="text-white hover:text-gray-300">✕</button>
                            </div>
                        </div>
                        <pre className="mt-2 max-h-40 overflow-auto font-mono text-xs">{debugErrorJson}</pre>
                    </div>
                )}

                {mensaje && (
                    <div id="form-payment-message" aria-live="assertive" className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 transition-all duration-300">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-600" aria-hidden="true" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-900">{mensaje}</span>
                    </div>
                )}
            </div>

            {procesando && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-[3px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-gray-100 border-t-[#7a0202]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Efectuando el pago...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
