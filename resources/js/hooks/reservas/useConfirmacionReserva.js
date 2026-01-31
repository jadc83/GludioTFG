import { useState } from 'react';
import { getReservaPayload } from '@/utils/reservaPayload';

export default function useConfirmacionReserva() {
	const [procesando, setProcesando] = useState(false);
	const [error, setError] = useState(null);
	const prepararDatosReserva = (...args) => {
		// Compatibilidad: aceptar tanto un objeto { getValues, rango, ... } como argumentos posicionales
		let params;
		if (args.length === 1 && args[0] && typeof args[0] === 'object') {
			params = args[0];
		} else {
			params = {
				getValues: args[0],
				rango: args[1],
				habitacionesSeleccionadas: args[2],
				idClienteSeleccionado: args[3],
				tipoClienteSeleccionado: args[4],
				usuarioActual: args[5],
			};
		}
		return getReservaPayload(params);
	};
	const crearReservaAlLlegar = async (datosReserva) => {
		setProcesando(true);
		setError(null);

		try {
			const { crearReserva } = await import('@/hooks/reservas/service');
			const data = await crearReserva(datosReserva);
			return data;
		} catch (err) {
			if (err.status === 409) {
				setError(err.cliente_existente
					? `Este DNI ya está registrado a nombre de: ${err.cliente_existente.name}`
					: 'Este cliente ya existe en nuestra base de datos.');
			} else {
				setError(err.message || err.error || 'Error al procesar la reserva');
			}
			throw err;
		} finally {
			setProcesando(false);
		}
	};

	return { procesando, errorPago: error, prepararDatosReserva, crearReservaAlLlegar, resetearErrores: () => setError(null)};
}
