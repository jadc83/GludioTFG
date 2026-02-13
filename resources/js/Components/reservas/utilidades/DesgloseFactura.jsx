import { t } from '@/i18n';
import {
    calcularNoches,
    formatearModificador,
    formatearMoneda,
} from '@/utils/formatters';

export default function DesgloseFactura({
    habitacionesSeleccionadas,
    rango,
    monto,
    agruparHabitacionesPorTipo,
    tarifasAplicadas = [],
    ultimoResultadoPrecio = null,
    preciosPorTipo = {},
}) {
    const numeroNoches = calcularNoches(rango?.from, rango?.to);
    const habitacionesConCantidad = Object.entries(
        habitacionesSeleccionadas,
    ).filter(([, r]) => r.cantidad > 0);

    const calcularPrecioTipo = (tipo) => {
        if (preciosPorTipo && preciosPorTipo[tipo] !== undefined)
            return Number(preciosPorTipo[tipo] || 0);

        try {
            const list = Array.isArray(ultimoResultadoPrecio?.habitaciones)
                ? ultimoResultadoPrecio.habitaciones
                : [];
            const match = list.find(
                (h) =>
                    String(h.tipo || '').toLowerCase() ===
                    String(tipo || '').toLowerCase(),
            );
            if (match)
                return Number(
                    match.precioAvg ?? match.precio ?? match.precioMinimo ?? 0,
                );
        } catch (e) {
        }

        const datosHabitacion = agruparHabitacionesPorTipo()[tipo] || {};
        return (
            datosHabitacion?.precioEntreNoche ??
            datosHabitacion?.precioNoche ??
            datosHabitacion?.precioTipo ??
            datosHabitacion?.precioMinimo ??
            0
        );
    };

    return (
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h3 className="text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    {t('paso2.summary_title')}
                </h3>
            </div>

            <div className="space-y-4 p-4">
                {habitacionesConCantidad.length > 0 && (
                    <div className="space-y-3">
                        {habitacionesConCantidad.map(([tipo, r]) => {
                            const precioPorNoche = calcularPrecioTipo(tipo);
                            const subtotal =
                                precioPorNoche * numeroNoches * r.cantidad;

                            return (
                                <div key={tipo} className="group">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-semibold capitalize text-gray-900">
                                                {t(`paso2.room_type.${tipo}`)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {r.cantidad}{' '}
                                                {t('paso2.nights', {
                                                    count: r.cantidad,
                                                })}{' '}
                                                × {numeroNoches}{' '}
                                                {t('paso2.nights', {
                                                    count: numeroNoches,
                                                })}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {formatearMoneda(subtotal)}
                                        </p>
                                    </div>
                                    <p className="mt-0.5 text-[10px] italic text-gray-400">
                                        {formatearMoneda(precioPorNoche)} por
                                        noche
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Separador sutil */}
                <div className="border-t border-dashed border-gray-200" />

                {/* Sección: Tarifas y Suplementos */}
                {tarifasAplicadas && tarifasAplicadas.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">
                            {t('paso2.supplements')}
                        </p>
                        {tarifasAplicadas.map((t) => {
                            const mod = Number(t.modificador_precio || 0);
                            const isMedia =
                                t.slug?.toLowerCase().includes('media') ||
                                t.nombre?.toLowerCase().includes('media');
                            const valorFinal = isMedia
                                ? mod * numeroNoches
                                : mod;

                            return (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between text-xs text-gray-700"
                                >
                                    <span className="flex items-center gap-1">
                                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                                        {t.nombre}
                                        {isMedia && (
                                            <span className="text-[10px] text-gray-400">
                                                ({numeroNoches}n)
                                            </span>
                                        )}
                                    </span>
                                    <span className="font-medium">
                                        {valorFinal === 0
                                            ? 'Gratis'
                                            : formatearModificador(
                                                  valorFinal,
                                                  'fijo',
                                              )}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-2 border-t-2 border-gray-50 pt-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                                {t('paso2.total')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black leading-none text-[#7a0202]">
                                {formatearMoneda(monto)}
                            </p>
                            <p className="mt-1 text-[9px] uppercase text-gray-400">
                                {t('paso2.taxes_included')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decoración inferior (opcional: efecto ticket) */}
            <div
                className="flex h-1 w-full bg-repeat-x"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, #f3f4f6 5px, transparent 5px)',
                    backgroundSize: '15px 15px',
                    backgroundPosition: '0 10px',
                }}
            />
        </div>
    );
}
