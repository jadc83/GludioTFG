import React from 'react';
import Campo from '@/Components/reservas/utilidades/Campo';
import FormularioPago from '@/Components/formularios/create/FormularioPago';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
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
                    label="Número de Huéspedes"
                    type="number"
                    min={1}
                    max={4}
                    value={formulario.num_huespedes}
                    onChange={cambiar}
                />

                <Campo
                    id="metodo_pago"
                    label="Método de Pago"
                    as="select"
                    value={formulario.metodo_pago}
                    onChange={cambiar}
                    error={errores.metodo_pago}
                    required
                >
                    <option value="recepcion">Pagar en Recepción</option>
                    <option value="tarjeta">Tarjeta de Crédito</option>
                    <option value="transferencia">Transferencia</option>
                </Campo>
            </div>

            <Campo
                id="notas"
                label="Notas / Observaciones (Opcional)"
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
                            Precio Total
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
                        onError={(err) => emitToast('Error en pago: ' + (err?.message || ''), 'error')}
                    />
                </div>
            )}
        </div>
    );
}
