import { calcularNoches, formatearMoneda } from '@/utils/formatters';
import { t } from '@/i18n';

export default function DetalleSubtotal({
    habitacionesSeleccionadas = {},
    rango = {},
    tarifasSeleccionadas = {},
    tarifas = [],
    tipos = {},
    preciosPorTipo = {},
    soloSubtotal = false,
}) {
    const numeroNoches = calcularNoches(rango?.from, rango?.to) || 0;
    const subtotalHabitaciones = Object.entries(
        habitacionesSeleccionadas || {},
    ).reduce((acc, [tipo, h]) => {
        const cantidad = Number(h.cantidad || 0);
        const precioDesdeSeleccion = Number(h.precioPorNoche || h.precio || 0);
        const tipoInfo = tipos?.[tipo] || {};
        const precioCalculado = preciosPorTipo?.[tipo] ?? null;
        const precioDesdeTipos = Number(
            precioCalculado ??
                tipoInfo.precioEntreNoche ??
                tipoInfo.precioNoche ??
                tipoInfo.precioTipo ??
                tipoInfo.precioMinimo ??
                0,
        );
        const precioPorNoche =
            precioDesdeSeleccion > 0 ? precioDesdeSeleccion : precioDesdeTipos;
        return acc + cantidad * precioPorNoche * numeroNoches;
    }, 0);

    const habitacionesTotalSeleccionadas = Object.values(
        habitacionesSeleccionadas || {},
    ).reduce((s, v) => s + Number(v.cantidad || 0), 0);
    let cargoTarifas = 0;
    const tarifasAplicadas = [];
    if (tarifas && Object.keys(tarifasSeleccionadas || {}).length > 0) {
        tarifas.forEach((t) => {
            if (!t || !t.id) return;
            if (!tarifasSeleccionadas[t.id]) return;
            const mod = Number(t.modificador_precio || 0);
            const slug = (t.slug || '').toLowerCase();
            let cargo = 0;
            if (slug.includes('desayuno')) {
                cargo = 0;
            } else if (
                slug.includes('media') ||
                slug.includes('pension') ||
                slug.includes('media-pension')
            ) {
                cargo =
                    Number(mod) *
                    Number(numeroNoches) *
                    Math.max(0, habitacionesTotalSeleccionadas);
            } else {
                cargo = Number(mod);
            }
            cargo = Math.round(cargo * 100) / 100;
            cargoTarifas += cargo;
            tarifasAplicadas.push({ id: t.id, nombre: t.nombre, cargo });
        });
    }

    const subtotal = subtotalHabitaciones + cargoTarifas;

    if (subtotal === 0 && !soloSubtotal) {
        return (
            <div className="w-full rounded bg-gris p-2">
                <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-gray-700">{t('subtotal.label')}</span>
                    <span className="text-sm text-gray-400">{t('subtotal.select_rooms')}</span>
                </div>
            </div>
        );
    }

    if (soloSubtotal) {
        return (
            <div className="text-right">
                <div className="text-base font-extrabold text-[#7a0202]">
                    {formatearMoneda(subtotal)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full rounded bg-gris p-2">
            <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-gray-700">{t('subtotal.label')}</span>
                <span className="text-base font-extrabold text-[#7a0202]">
                    {formatearMoneda(subtotal)}
                </span>
            </div>
        </div>
    );
}
