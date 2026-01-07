import { calcularNoches, formatearMoneda } from '../../utils/formatters';

export default function DesgloseFactura({ habitacionesSeleccionadas, rango, monto, getTotalHabitaciones, agruparHabitacionesPorTipo }) {
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
        <div className="w-full rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-3">
            <h3 className="text-xs font-bold text-gray-900 mb-2 pb-2 border-b border-gray-300">
                Desglose de tu reserva
            </h3>

            {mostrarDesglose ? (
                <>
                    {/* Tabla detallada */}
                    <div className="space-y-2 mb-2">
                        {habitacionesConCantidad.map(([tipo, r]) => {
                            const precioPorNoche = calcularPrecioTipo(tipo);
                            const subtotal = calcularSubtotal(tipo, r.cantidad);

                            return (
                                <div key={tipo} className="bg-white rounded-lg border border-gray-100 p-2 hover:shadow-sm transition">
                                    {/* Encabezado */}
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-900">
                                                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                {r.cantidad} hab × {numeroNoches} noche{numeroNoches !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-600 mb-0.5">
                                                {formatearMoneda(precioPorNoche)}/n
                                            </p>
                                            <p className="text-[11px] font-bold text-[#7a0202]">
                                                {formatearMoneda(subtotal)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Desglose de cálculo */}
                                    <div className="text-[10px] text-gray-600 bg-gray-50 rounded p-1.5 border border-gray-100">
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

                    {/* Resumen final */}
                    <div className="bg-gradient-to-r from-[#7a0202]/5 to-[#7a0202]/10 rounded-lg p-2 border border-[#7a0202]/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-gray-600 mb-0.5">Total a pagar</p>
                                <p className="text-[10px] font-semibold text-gray-700">
                                    {getTotalHabitaciones()} hab · {numeroNoches}n
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
                <div className="bg-gradient-to-r from-[#7a0202]/5 to-[#7a0202]/10 rounded-lg p-2 border border-[#7a0202]/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-600 mb-0.5">Total a pagar</p>
                            <p className="text-[10px] font-semibold text-gray-700">
                                1 hab · {numeroNoches}n
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-[#7a0202]">
                                {formatearMoneda(monto)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
