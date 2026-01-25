import React from 'react';
import { calcularNoches, formatearMoneda } from '@/utils/formatters';

export default function DetalleSubtotal({ habitacionesSeleccionadas = {}, rango = {}, tarifasSeleccionadas = {}, tarifas = [], tipos = {}, soloSubtotal = false }) {
	const numeroNoches = calcularNoches(rango?.from, rango?.to) || 0;

	// Calcular subtotal habitaciones. Si la selección no contiene precio, intentar usar el precio desde `tipos` (agruparHabitacionesPorTipo)
	const subtotalHabitaciones = Object.entries(habitacionesSeleccionadas || {}).reduce((acc, [tipo, h]) => {
		const cantidad = Number(h.cantidad || 0);
		const precioDesdeSeleccion = Number(h.precioPorNoche || h.precio || 0);
		const precioDesdeTipos = tipos?.[tipo]?.precioNoche || tipos?.[tipo]?.precioMinimo || 0;
		const precioPorNoche = precioDesdeSeleccion > 0 ? precioDesdeSeleccion : Number(precioDesdeTipos || 0);
		return acc + (cantidad * precioPorNoche * numeroNoches);
	}, 0);

	// Calcular total tarifas: tarifasSeleccionadas es objeto { id: true }
	const tarifasMap = Array.isArray(tarifas) ? tarifas.reduce((m, t) => (m[t.id] = t, m), {}) : {};
	const totalTarifas = Object.keys(tarifasSeleccionadas || {}).reduce((acc, id) => {
		const tarifa = tarifasMap[id];
		const mod = Number(tarifa?.modificador_precio || 0);
		const isMedia = (tarifa?.slug && tarifa.slug.toLowerCase().includes('media')) || (tarifa?.nombre && tarifa.nombre.toLowerCase().includes('media'));
		return acc + (isMedia ? mod * numeroNoches : mod);
	}, 0);

	const subtotal = subtotalHabitaciones + totalTarifas;

	// Si el subtotal es 0, no mostrar nada (evita mostrar "€0.00" en la UI)
	if (subtotal === 0) return null;

	if (soloSubtotal) {
		return (
			<div className="text-right">
				<div className="text-sm font-bold text-[#7a0202]">{formatearMoneda(subtotal)}</div>
			</div>
		);
	}

	return (
		<div className="w-full bg-gris rounded p-2">
			<div className="flex items-center justify-between text-[12px]">
				<span>Subtotal habitaciones</span>
				<span className="font-semibold">{formatearMoneda(subtotalHabitaciones)}</span>
			</div>
			<div className="flex items-center justify-between text-[12px] mt-1">
				<span>Tarifas aplicadas</span>
				<span className="font-semibold">{totalTarifas === 0 ? 'Gratis' : formatearMoneda(totalTarifas)}</span>
			</div>
			<div className="border-t mt-2 pt-2 flex items-center justify-between text-[13px] font-bold">
				<span>Total</span>
				<span className="text-[#7a0202]">{formatearMoneda(subtotal)}</span>
			</div>
		</div>
	);
}
