import FormularioPago from '@/Components/formularios/create/FormularioPago';
import Campo from '@/Components/reservas/utilidades/Campo';
import { t } from '@/i18n';
import { emitToast } from '@/utils/toast';

export default function PagoPanel({
    formulario,
    cambiar,
    errores,
    precioCalculado,
    habitacionesPorTipo,
    tarifasSeleccionadas,
    aceptaTerminos,
    setAceptaTerminos,
    onPagoExitoso,
}) {
    const reservaData = {
        check_in: formulario.check_in,
        check_out: formulario.check_out,
        name: formulario.nombre_cliente,
        email: formulario.email_cliente,
        telefono: formulario.telefono_cliente,
        habitaciones: Object.entries(habitacionesPorTipo)
            .filter(([, info]) => info.cantidad > 0)
            .map(([tipo, info]) => ({ tipo, cantidad: info.cantidad })),
        tarifas: tarifasSeleccionadas,
        num_huespedes: formulario.num_huespedes,
        metodo_pago: 'tarjeta',
        notas: formulario.notas,
        reservable_id: formulario.reservable_id,
        reservable_type: formulario.reservable_type,
    };

    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            <div className="grid grid-cols-2 gap-4">
                <Campo
                    id="num_huespedes"
                    label={t('payment.number_of_guests')}
                    type="number"
                    min={1}
                    max={4}
                    value={formulario.num_huespedes}
                    onChange={cambiar}
                />

                <Campo
                    id="metodo_pago"
                    label={t('payment.payment_method')}
                    as="select"
                    value={formulario.metodo_pago}
                    onChange={cambiar}
                    error={errores.metodo_pago}
                    required
                >
                    <option value="recepcion">
                        {t('payment.pay_at_reception')}
                    </option>
                    <option value="tarjeta">{t('payment.credit_card')}</option>
                    <option value="transferencia">
                        {t('payment.bank_transfer')}
                    </option>
                </Campo>
            </div>

            <Campo
                id="notas"
                label={t('payment.notes_optional')}
                as="textarea"
                rows={3}
                value={formulario.notas}
                onChange={cambiar}
                error={errores.notas}
            />

            {/* RESUMEN DE PRECIO */}
            {precioCalculado > 0 && (
                <div className="rounded-xl border-2 border-[#7a0202] bg-red-50 p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-black uppercase tracking-tight text-gray-900">
                            {t('subtotal.total_price')}
                        </span>
                        <span className="text-3xl font-black text-[#7a0202]">
                            €{precioCalculado.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {/* FORMULARIO DE PAGO STRIPE */}
            {formulario.metodo_pago === 'tarjeta' && precioCalculado > 0 && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                    <FormularioPago
                        monto={precioCalculado}
                        reservaData={reservaData}
                        aceptaTerminos={aceptaTerminos}
                        mostrarAceptacion={true}
                        onCambioAceptaTerminos={setAceptaTerminos}
                        onPagoExitoso={onPagoExitoso}
                        onError={(err) =>
                            emitToast(
                                t('toasts.payment_error') +
                                    (err?.message
                                        ? ': ' + (err?.message || '')
                                        : ''),
                                'error',
                            )
                        }
                    />
                </div>
            )}
        </div>
    );
}
