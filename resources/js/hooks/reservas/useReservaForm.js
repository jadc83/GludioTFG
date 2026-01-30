import { useForm } from 'react-hook-form';
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import { formatearFecha } from '@/utils/fecha';
import { getReservaPayload } from '@/utils/reservaPayload';
import useHabitaciones from '../habitaciones/useHabitaciones';

export default function useReservaForm() {
	const { props } = usePage();
	const usuarioActual = props.auth?.user ?? null;
	const flash = props.flash ?? {};

	// 1. Estados básicos
	const [pasoActual, setPasoActual] = useState(1);
	const [mensajeError, setMensajeError] = useState('');
	const [rango, setRango] = useState({ from: undefined, to: undefined });
	const [numHuespedes, setNumHuespedes] = useState(1);

	// 2. Estados de Selección y Precios
	const [selectedTarifas, setSelectedTarifas] = useState({});
	const [tarifasLookup, setTarifasLookup] = useState({});
	const [ultimoPrecio, setUltimoPrecio] = useState(null);
	const [preciosPorTipo, setPreciosPorTipo] = useState({});

	// 3. IDs de reserva (Flash)
	const [idReserva, setIdReserva] = useState(flash.reserva_id);
	const [localizador, setLocalizador] = useState(flash.localizador);

	// Debug: log cambios de rango para depuración de cargas
	useEffect(() => {
		try {
			console.log('useReservaForm rango changed:', rango);
			try { window.__lastRango = rango; window.__lastRangoTime = Date.now(); } catch (e) {}
		} catch (e) { /* noop */ }
	}, [rango]);

	useEffect(() => {
		if (flash.reserva_id) setIdReserva(flash.reserva_id);
		if (flash.localizador) setLocalizador(flash.localizador);
	}, [flash.reserva_id, flash.localizador]);

	// 4. Event Listeners para Tarifas
	useEffect(() => {
		const onTarifas = (e) => setSelectedTarifas(e?.detail || {});
		const onLista = (e) => {
			const map = {};
			(e?.detail || []).forEach(t => map[t.id] = t);
			setTarifasLookup(map);
		};

		window.addEventListener('tarifasSeleccionadas', onTarifas);
		window.addEventListener('tarifasLista', onLista);
		return () => {
			window.removeEventListener('tarifasSeleccionadas', onTarifas);
			window.removeEventListener('tarifasLista', onLista);
		};
	}, []);

	// 5. Gestión de Formulario
	const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm({
		mode: 'onSubmit',
		defaultValues: {
			name: usuarioActual?.name || '',
			email: usuarioActual?.email || '',
			telefono: usuarioActual?.telefono || '',
			tipo_documento: 'dni',
			numero_documento: usuarioActual?.numero_documento || '',
			nacionalidad: usuarioActual?.nacionalidad || '',
			direccion: usuarioActual?.direccion || '',
			habitaciones: [],
		}
	});

	// 6. Hook de Habitaciones
	const habitaciones = useHabitaciones({ paso: pasoActual, rango, setRango });

	// Exponer recarga para desarrollo/consola
	useEffect(() => {
		if (typeof window !== 'undefined' && habitaciones.recargarDisponibles) {
			window.formularioReservaRef = { recargarDisponibles: habitaciones.recargarDisponibles };
		}
		return () => { if (window.formularioReservaRef) delete window.formularioReservaRef; };
	}, [habitaciones]);

	// 7. Navegación y Lógica
	const avanzarPaso = () => {
		setMensajeError('');
		if (pasoActual === 1 && (!rango?.from || !rango?.to))
			return setMensajeError('Selecciona un rango de fechas.');

		if (pasoActual === 2) {
			const totalSel = habitaciones.getTotalHabitaciones();
			const totalDisp = habitaciones.habitacionesDisponibles.length;

			if (totalSel > CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA)
				return setMensajeError(`Máximo ${CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA} habitaciones.`);
			if (totalSel > totalDisp)
				return setMensajeError(`Solo hay ${totalDisp} disponibles.`);

			// Si hay un usuario logueado, rellenar sus datos y saltar directamente al paso 4
			if (usuarioActual) {
				try {
					setValue('name', usuarioActual.name || '');
					setValue('email', usuarioActual.email || '');
					setValue('telefono', usuarioActual.telefono || '');
					setValue('tipo_documento', usuarioActual.tipo_documento || 'dni');
					setValue('numero_documento', usuarioActual.numero_documento || '');
					setValue('nacionalidad', usuarioActual.nacionalidad || '');
					setValue('direccion', usuarioActual.direccion || '');
				} catch (e) {
					// noop si setValue falla por cualquier motivo
				}

				setPasoActual(4);
				return;
			}
		}

		setPasoActual(prev => prev + 1);
	};

	const precioSinTarifas = async () => {
		if (!rango?.from || !rango?.to) return 0;
		const habs = Object.entries(habitaciones.habitacionesSeleccionadas)
			.filter(([_, s]) => s.cantidad > 0)
			.map(([tipo, s]) => ({ tipo, cantidad: s.cantidad }));

		if (!habs.length) return 0;

		try {
			const { calcularPrecio } = await import('@/hooks/reservas/service');
			const data = await calcularPrecio({
				check_in: formatearFecha(rango.from),
				check_out: formatearFecha(rango.to),
				habitaciones: habs,
				tarifas: Object.keys(selectedTarifas).filter(k => selectedTarifas[k]).map(Number),
			});
			if (data?.success) setUltimoPrecio(data.data);
			return data?.data || 0;
		} catch { return 0; }
	};

	// Calcular precios por tipo cuando cambian rango, selección de habitaciones o tarifas
	useEffect(() => {
		let mounted = true;
		const calcular = async () => {
			if (!rango?.from || !rango?.to) {
				if (mounted) setPreciosPorTipo({});
				return;
			}
			const habs = Object.entries(habitaciones.habitacionesSeleccionadas)
				.filter(([_, s]) => s.cantidad > 0)
				.map(([tipo, s]) => ({ tipo, cantidad: s.cantidad }));
			if (!habs.length) {
				if (mounted) setPreciosPorTipo({});
				return;
			}
			try {
				const { calcularPrecio } = await import('@/hooks/reservas/service');
				const data = await calcularPrecio({
					check_in: formatearFecha(rango.from),
					check_out: formatearFecha(rango.to),
					habitaciones: habs,
					tarifas: Object.keys(selectedTarifas).filter(k => selectedTarifas[k]).map(Number),
				});
				if (mounted) {
					if (data && Array.isArray(data.habitaciones)) {
						const map = {};
						data.habitaciones.forEach(h => {
							if (h.tipo) map[h.tipo] = Number(h.precioAvg ?? h.precio ?? h.precioMinimo ?? 0);
						});
						setPreciosPorTipo(map);
					} else {
						setPreciosPorTipo({});
					}
				}
			} catch (e) {
				if (mounted) setPreciosPorTipo({});
			}
		};
		calcular();
		return () => { mounted = false; };
	}, [rango, habitaciones.habitacionesSeleccionadas, selectedTarifas]);

	const confirmarReserva = () => {
		const payload = getReservaPayload({
			getValues, rango,
			habitacionesSeleccionadas: habitaciones.habitacionesSeleccionadas,
			usuarioActual
		});

		router.post('/reservas', payload, {
			onSuccess: () => {
				setPasoActual(1);
				habitaciones.limpiarRango();
				const drawer = document.getElementById('drawer-toggle');
				if (drawer) drawer.checked = false;
				router.reload();
			},
			onError: (err) => setMensajeError(err.message || Object.values(err)[0] || 'Error al reservar')
		});
	};

	return {
		register, handleSubmit, errors, watch, setValue, getValues,
		pasoActual, setPasoActual, avanzarPaso, retrocederPaso: () => setPasoActual(p => p - 1),
		mensajeError, setMensajeError,
		rango, setRango,
		...habitaciones, // Exporta automáticamente getIcono, getImagen, etc.
		preciosPorTipo,
		precioSinTarifas, ultimoResultadoPrecio: ultimoPrecio,
		confirmarReserva,
		usuarioActual, idReserva, localizador, numHuespedes, setNumHuespedes,
		selectedTarifas, tarifasLookup
	};
}
