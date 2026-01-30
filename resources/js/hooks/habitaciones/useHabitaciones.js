import React, { useEffect, useState, useMemo } from 'react';
import { fetchHabitacionesDisponibles } from './service';
import { formatearFecha } from '@/utils/fecha';
import IconSvg from '@/components/icons/RoomIcons';

const UI_ASSETS = {
	imagenes: {
		individual: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
		doble: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
		familiar: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
		suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
		default: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop'
	},
	iconos: {
		individual: 'bed-single',
		doble: 'bed-double',
		familiar: 'family',
		suite: 'suite',
		default: 'hotel'
	}
};

export default function useHabitaciones({ paso, rango, setRango }) {
	const [habitaciones, setHabitaciones] = useState([]);
	const [cargando, setCargando] = useState(false);
	const [seleccion, setSeleccion] = useState({});

	// Carga de datos con limpieza automática
	// Encapsular la carga en una función para permitir recarga manual
	const cargarHabitaciones = async (signal) => {
		const rangoValido = rango?.from && rango?.to;
		if (!rangoValido) {
			setHabitaciones([]);
			return;
		}

		setCargando(true);
		setSeleccion({}); // Reset al cambiar fechas
		try {
			const datos = await fetchHabitacionesDisponibles(
				formatearFecha(rango.from),
				formatearFecha(rango.to),
				{ signal }
			);
			setHabitaciones(Array.isArray(datos) ? datos : []);
		} catch (err) {
			if (err?.name !== 'AbortError') setHabitaciones([]);
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		if (paso !== 2) return;
		const controller = new AbortController();
		cargarHabitaciones(controller.signal);
		return () => controller.abort();
	}, [paso, rango]);

	// Valores calculados (Estado derivado)
	// Esto sustituye a las funciones "getTotal..." y "agrupar..."
	const totales = useMemo(() => ({
		seleccionadas: Object.values(seleccion).reduce((acc, s) => acc + (s.cantidad || 0), 0),
		disponibles: (habitaciones || []).length,
	}), [seleccion, habitaciones]);

	const habitacionesPorTipo = useMemo(() => {
		// Agrupar habitaciones por `tipo` y computar cantidad y capacidades
		const acc = {};
		(habitaciones || []).forEach(h => {
			const tipo = h.tipo || 'unknown';
			if (!acc[tipo]) {
				acc[tipo] = {
					precioMinimo: h.precio || h.precioMinimo || 0,
					capacidadMaxima: Number(h.capacidad || 0),
					cantidad: 1,
					descripcion: h.descripcion || '',
					fotos: h.fotos || [],
				};
			} else {
				acc[tipo].cantidad += 1;
				acc[tipo].capacidadMaxima = Math.max(acc[tipo].capacidadMaxima, Number(h.capacidad || 0));
				acc[tipo].precioMinimo = Math.min(acc[tipo].precioMinimo || 0, h.precio || h.precioMinimo || 0) || acc[tipo].precioMinimo;
			}
		});
		return acc;
	}, [habitaciones]);

	// Handlers simplificados
	const actualizarSeleccion = (tipo, campo, valor) => {
		setSeleccion(prev => {
			const actual = prev[tipo] || { cantidad: 0, personas: 1 };
			const nuevoValor = (campo === 'cantidad' || campo === 'personas') ? Number(valor) : valor;
			const data = { ...actual, [campo]: nuevoValor };

			// Lógica: si hay habitaciones, debe haber al menos 1 persona
			if (campo === 'cantidad' && nuevoValor > 0 && !data.personas) data.personas = 1;

			return { ...prev, [tipo]: data };
		});
	};

	// Compatibilidad: funciones antiguas esperadas por los componentes
	const agruparHabitacionesPorTipo = (numHuespedes = null) => {
		if (!numHuespedes) return habitacionesPorTipo;
		// Filtrar tipos que puedan alojar al número de huéspedes (si se proporciona)
		const resultado = {};
		Object.entries(habitacionesPorTipo).forEach(([tipo, info]) => {
			const capacidad = Number(info?.capacidadMaxima || info?.capacidad || 0);
			if (!capacidad || capacidad >= Number(numHuespedes)) resultado[tipo] = info;
		});
		return resultado;
	};

	const getTotalHabitaciones = () => totales.seleccionadas;
	const getTotalDisponibles = () => totales.disponibles;

	return {
		rango, setRango,
		habitacionesDisponibles: habitaciones,
		estaCargandoHabitaciones: cargando,
		habitacionesSeleccionadas: seleccion,
		totalHabitaciones: totales.seleccionadas,
		totalDisponibles: totales.disponibles,
		habitacionesPorTipo, // Ya agrupadas por objeto
		// Compatibilidad API
		agruparHabitacionesPorTipo,
		getTotalHabitaciones,
		getTotalDisponibles,

		// Helpers de UI
		getIcono: (tipo, props) => React.createElement(IconSvg, {
			name: UI_ASSETS.iconos[tipo?.toLowerCase()] || UI_ASSETS.iconos.default, ...props
		}),
		getImagen: (tipo) => UI_ASSETS.imagenes[tipo?.toLowerCase()] || UI_ASSETS.imagenes.default,

		// Acciones
		actualizarSeleccionHabitacion: actualizarSeleccion,
		eliminarTipoHabitacion: (tipo) => setSeleccion(({ [tipo]: _, ...resto }) => resto),
		resetSeleccion: () => setSeleccion({}),
		limpiarRango: () => setRango(null)
		,
		// Permitir recarga manual desde UI
		recargarDisponibles: () => cargarHabitaciones(),
	};
}
