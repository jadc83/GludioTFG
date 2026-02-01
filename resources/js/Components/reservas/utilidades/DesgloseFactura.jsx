import { calcularNoches, formatearMoneda } from '@/utils/formatters';

export default function DesgloseFactura({
    habitacionesSeleccionadas,
    rango,
    monto,
    getTotalHabitaciones,
    agruparHabitacionesPorTipo,
    tarifasAplicadas = [],
    cargoTarifas = 0,
    ultimoResultadoPrecio = null,
    preciosPorTipo = {}
}) {
    const numeroNoches = calcularNoches(rango?.from, rango?.to);
    const habitacionesConCantidad = Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0);

    const calcularPrecioTipo = (tipo) => {
        if (preciosPorTipo && preciosPorTipo[tipo] !== undefined) return Number(preciosPorTipo[tipo] || 0);

        try {
            const list = Array.isArray(ultimoResultadoPrecio?.habitaciones) ? ultimoResultadoPrecio.habitaciones : [];
            const match = list.find(h => String(h.tipo || '').toLowerCase() === String(tipo || '').toLowerCase());
            if (match) return Number(match.precioAvg ?? match.precio ?? match.precioMinimo ?? 0);
        } catch (e) {}

        const datosHabitacion = agruparHabitacionesPorTipo()[tipo] || {};
        return datosHabitacion?.precioEntreNoche ?? datosHabitacion?.precioNoche ?? datosHabitacion?.precioTipo ?? datosHabitacion?.precioMinimo ?? 0;
    };

    return (
        <div className="w-full bg-transparent">
            <div className="space-y-4">
                {habitacionesConCantidad.length > 0 && (
                    <div className="space-y-3">
                        {habitacionesConCantidad.map(([tipo, r]) => {
                            const precioPorNoche = calcularPrecioTipo(tipo);
                            const subtotal = precioPorNoche * numeroNoches * r.cantidad;

                            return (
                                <div key={tipo} className="group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-white capitalize">
                                                {tipo}
                                            </p>
                                            <p className="text-xs text-white/50">
                                                {r.cantidad} {r.cantidad === 1 ? 'Habitación' : 'Habitaciones'} × {numeroNoches} {numeroNoches === 1 ? 'noche' : 'noches'}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-white">
                                            {formatearMoneda(subtotal)}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-white/40 mt-0.5 italic">
                                        {formatearMoneda(precioPorNoche)} por noche
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Separador visual */}
                <div className="border-t border-white/20" />

                {/* Sección: Tarifas y Suplementos */}
                {tarifasAplicadas && tarifasAplicadas.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-tight">Suplementos</p>
                        {tarifasAplicadas.map(t => {
                            const mod = Number(t.modificador_precio || 0);
                            const isMedia = (t.slug?.toLowerCase().includes('media')) || (t.nombre?.toLowerCase().includes('media'));
                            const valorFinal = isMedia ? mod * numeroNoches : mod;

                            return (
                                <div key={t.id} className="flex justify-between items-center text-xs text-white/70">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1 h-1 bg-white/30 rounded-full" />
                                        {t.nombre}
                                        {isMedia && <span className="text-[10px] text-white/40">({numeroNoches}n)</span>}
                                    </span>
                                    <span className="font-medium">
                                        {valorFinal === 0 ? 'Gratis' : `${valorFinal > 0 ? '+' : ''}${formatearMoneda(valorFinal)}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="pt-3 mt-2 border-t border-white/20">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-bold text-white/60 uppercase">Total</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-white leading-none">
                                {formatearMoneda(monto)}
                            </p>
                            <p className="text-[9px] text-white/40 mt-1 uppercase">Impuestos incluidos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
