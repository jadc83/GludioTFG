export async function processPaymentIntentResult({
    dataPI,
    confirmarPaymentIntent,
    onPagoExitoso,
}) {
    if (!dataPI) return false;

    if (dataPI.paymentIntentStatus === 'succeeded') {
        // Inform app that payment is confirmed
        const confirmJson = await confirmarPaymentIntent(
            dataPI.paymentIntentId,
            dataPI.pago_id,
        );
        if (typeof onPagoExitoso === 'function') {
            onPagoExitoso({
                pago_id: dataPI.pago_id,
                confirmData: confirmJson,
            });
        }
        return true;
    }

    return false;
}
