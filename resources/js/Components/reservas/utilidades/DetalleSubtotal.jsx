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

	// Mostrar únicamente el subtotal de habitaciones (no incluir tarifas aquí)
	const subtotal = subtotalHabitaciones;

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
				<span className="font-medium text-gray-700">Subtotal</span>
				<span className="font-semibold text-[#7a0202]">{formatearMoneda(subtotal)}</span>
			</div>
		</div>
	);
}
