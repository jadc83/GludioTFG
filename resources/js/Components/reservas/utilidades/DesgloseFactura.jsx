import { calcularNoches, formatearMoneda } from '@/utils/formatters';

export default function DesgloseFactura({ habitacionesSeleccionadas, rango, monto, getTotalHabitaciones, agruparHabitacionesPorTipo, tarifasAplicadas = [], cargoTarifas = 0 }) {
    const numeroNoches = calcularNoches(rango?.from, rango?.to);
    const habitacionesConCantidad = Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0);
    const mostrarDesglose = getTotalHabitaciones() > 1;

    // Calcular precio por tipo basado en el precio mínimo del desglose
    const calcularPrecioTipo = (tipo) => {
        const datosHabitacion = agruparHabitacionesPorTipo()[tipo];
        return datosHabitacion?.precioMinimo || 0;
    };

    // Calcular subtotal por tipo
    const calcularSubtotal = (tipo, cantidad) => {
        const precioPorNoche = calcularPrecioTipo(tipo);
        return precioPorNoche * numeroNoches * cantidad;
    };

    return (
        <div className="w-full rounded-lg bg-gris p-2">

            <h3 className="text-sm font-bold text-gray-900 text-center p-2 rounded-lg bg-white">
                Desglose de tu reserva
            </h3>

            {mostrarDesglose ? (
                <>
                    {/* Tabla detallada */}
                    <div className="space-y-1 mb-1">
                        {habitacionesConCantidad.map(([tipo, r]) => {
                            const precioPorNoche = calcularPrecioTipo(tipo);
                            const subtotal = calcularSubtotal(tipo, r.cantidad);

                            return (
                                <div key={tipo} className="bg-gris rounded-lg p-2 hover:shadow-sm transition">
                                    {/* Encabezado */}
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div>
                                            <p className="text-[12px] font-bold text-gray-900">
                                                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                {r.cantidad} Hab × {numeroNoches} noche{numeroNoches !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-600 mb-0.5">
                                                {formatearMoneda(precioPorNoche)}/noche
                                            </p>
                                            <p className="text-[11px] font-bold text-[#7a0202]">
                                                {formatearMoneda(subtotal)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Desglose de cálculo */}
                                        <div className="text-[11px] text-gray-600 bg-gris rounded p-1.5">
                                        <div className="flex justify-between mb-0.5">
                                            <span>{formatearMoneda(precioPorNoche)} × {numeroNoches}n</span>
                                            <span className="font-semibold">{formatearMoneda(precioPorNoche * numeroNoches)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>× {r.cantidad} hab</span>
                                            <span className="font-semibold">{formatearMoneda(subtotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tarifas aplicadas (mostrar antes del resumen final) */}
                    {tarifasAplicadas && tarifasAplicadas.length > 0 && (
                        <div className="mt-1 bg-white rounded-lg p-2 border border-gray-100">
                            <div className="space-y-1 text-[11px] text-gray-800">
                                {tarifasAplicadas.map(t => {
                                    const mod = Number(t.modificador_precio || 0);
                                    const isMedia = (t.slug && t.slug.toLowerCase().includes('media')) || (t.nombre && t.nombre.toLowerCase().includes('media'));
                                    if (isMedia) {
                                        const porNoche = mod;
                                        const total = porNoche * numeroNoches;
                                        return (
                                            <div key={t.id} className="w-full">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px]">{t.nombre} <span className="text-xs text-gray-500">(por noche)</span></span>
                                                    <span className="font-semibold">{porNoche === 0 ? 'Gratis' : `${porNoche >= 0 ? '+' : ''}${porNoche.toFixed(0)}€/n`}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-gray-700 mt-0.5">
                                                    <span className="text-gray-500">Total {numeroNoches} noche{numeroNoches !== 1 ? 's' : ''}</span>
                                                    <span className="font-semibold">{total === 0 ? 'Gratis' : `${total >= 0 ? '+' : ''}${formatearMoneda(total)}`}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={t.id} className="flex items-center justify-between">
                                            <span className="text-[11px]">{t.nombre}</span>
                                            <span className="font-semibold">{mod === 0 ? 'Gratis' : `${mod >= 0 ? '+' : ''}${mod.toFixed(0)}€`}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-2 border-t pt-2 text-[11px] text-gray-700 flex items-center justify-between">
                                <span className="font-medium">Total tarifas</span>
                                <span className="font-semibold">{cargoTarifas || cargoTarifas === 0 ? formatearMoneda(cargoTarifas) : '—'}</span>
                            </div>
                        </div>
                    )}

                    {/* Resumen final */}
                    <div className="bg-gris rounded-lg p-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-gray-600 mb-0.5">Total a pagar</p>
                                <p className="text-[11px] font-semibold text-gray-700">
                                    {getTotalHabitaciones()} habitación{getTotalHabitaciones() !== 1 ? 'es' : ''} · {numeroNoches} noche{numeroNoches !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[#7a0202]">
                                    {formatearMoneda(monto)}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Resumen simple */}

                    {tarifasAplicadas && tarifasAplicadas.length > 0 && (
                        <div className="mt-2 bg-white rounded-lg p-2 border border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-700">
                            {getTotalHabitaciones()} habitación{getTotalHabitaciones() !== 1 ? 'es' : ''} durante {numeroNoches} noche{numeroNoches !== 1 ? 's' : ''}
                        </p>
                            <div className="space-y-1 text-[11px] text-gray-800">
                                {tarifasAplicadas.map(t => (
                                    <div key={t.id} className="flex items-center justify-between">
                                        <span>{t.nombre}</span>
                                        <span className="font-semibold">{Number(t.modificador_precio) === 0 ? 'Gratis' : `${Number(t.modificador_precio) >= 0 ? '+' : ''}${Number(t.modificador_precio).toFixed(0)}€`}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-gris rounded-lg p-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-gray-600 mb-0.5">Total a pagar</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[#7a0202]">
                                    {formatearMoneda(monto)}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
