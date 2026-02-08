import { useState, useEffect } from 'react';
import axios from 'axios';
import { emitToast } from '@/utils/toast';
import { CalendarIcon, ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function FechaEditor({
	reserva,
	setReserva,
	refresh,
	vistaPrevia = null,
	cargandoVistaPrevia = false,
	errorVistaPrevia = null,
	obtenerPreview = null,
	onRequestConfirmDates = null,
	clearPreview = null
}) {
	const status = String(reserva?.status || '').toLowerCase();
	if (status === 'checked_in' || status === 'checked_out') return null;
	const [checkIn, setCheckIn] = useState(reserva.check_in || '');
	const [checkOut, setCheckOut] = useState(reserva.check_out || '');
	const [saving, setSaving] = useState(false);
	const [previewLoaded, setPreviewLoaded] = useState(false);

	const esFechaOriginal = (ci, co) => ci === reserva?.check_in && co === reserva?.check_out;

	useEffect(() => {
		let mounted = true;
		const tryFetch = async () => {
			if (!obtenerPreview || !checkIn || !checkOut || esFechaOriginal(checkIn, checkOut)) {
				setPreviewLoaded(false);
				return;
			}
			try {
				setPreviewLoaded(false);
				await obtenerPreview(checkIn, checkOut, reserva);
				if (mounted) setPreviewLoaded(true);
			} catch (e) {
				if (mounted) setPreviewLoaded(false);
			}
		};
		tryFetch();
		return () => { mounted = false; };
	}, [checkIn, checkOut, obtenerPreview, reserva]);

	const onSave = async (e) => {
		e?.preventDefault();
		if (!checkIn || !checkOut) return emitToast('Rellena ambas fechas', 'error');
		if (new Date(checkIn) >= new Date(checkOut)) return emitToast('El check-out debe ser posterior', 'error');

		setSaving(true);
		try {
			if (!esFechaOriginal(checkIn, checkOut) && typeof onRequestConfirmDates === 'function') {
				onRequestConfirmDates(checkIn, checkOut);
				setSaving(false);
				return;
			}

			const payload = {
				check_in: checkIn,
				check_out: checkOut,
				status: reserva.status || 'pendiente',
				pago: reserva.pago?.estado || 'pendiente',
				habitacion_ids: (reserva.habitaciones || [])
					.map(h => Number(h.habitacion_id ?? h.id))
					.filter(n => Number.isInteger(n))
			};

			await axios.put(`/reservas/${reserva.id}`, payload);
			emitToast('Fechas actualizadas', 'success');
			if (refresh) await refresh();
		} catch (err) {
			emitToast(err.response?.data?.message || 'Error al actualizar', 'error');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
			<form onSubmit={onSave} className="p-5">
				<div className="flex flex-col md:flex-row md:items-end gap-4">
					{/* Inputs de Fecha */}
					<div className="grid grid-cols-2 gap-4 flex-1">
						<div className="space-y-1">
							<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in</label>
							<div className="relative">
								<CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="date"
									value={checkIn}
									onChange={(e) => setCheckIn(e.target.value)}
									className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-out</label>
							<div className="relative">
								<CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="date"
									value={checkOut}
									onChange={(e) => setCheckOut(e.target.value)}
									className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
								/>
							</div>
						</div>
					</div>

					{/* Grupo de Acciones: Limpiar + Guardar */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => {
								setCheckIn(reserva?.check_in || '');
								setCheckOut(reserva?.check_out || '');
								if (clearPreview) clearPreview();
							}}
							className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all border border-transparent hover:border-gray-200"
							title="Restablecer fechas originales"
						>
							<ArrowPathIcon className="w-5 h-5" />
						</button>

						{!esFechaOriginal(checkIn, checkOut) ? (
							<button
								type="submit"
								disabled={saving}
								className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
							>
								{saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
								<span>{saving ? 'Guardando...' : 'Actualizar'}</span>
							</button>
						) : (
							<button type="button" disabled className="px-6 py-2.5 bg-gray-50 text-gray-400 text-sm font-semibold rounded-lg border border-gray-200 cursor-not-allowed italic">
								Sin cambios
							</button>
						)}
					</div>
				</div>

				{/* Panel de Vista Previa (Solo aparece si hay cambios) */}
				{(cargandoVistaPrevia || previewLoaded || errorVistaPrevia) && (
					<div className={`mt-5 p-4 rounded-lg border ${errorVistaPrevia ? 'bg-red-50 border-red-100' : 'bg-blue-50/30 border-blue-100'}`}>
						{cargandoVistaPrevia ? (
							<div className="flex items-center gap-3 text-sm text-blue-600 font-medium">
								<ArrowPathIcon className="w-4 h-4 animate-spin" />
								Calculando disponibilidad y precios...
							</div>
						) : errorVistaPrevia ? (
							<div className="flex items-center gap-2 text-sm text-red-600 font-medium">
								<XMarkIcon className="w-5 h-5" />
								{typeof errorVistaPrevia === 'string' ? errorVistaPrevia : errorVistaPrevia?.message}
							</div>
						) : vistaPrevia && (
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div className="flex gap-8">
									{/* Diferencia Monetaria */}
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Impacto Económico</p>
										<p className={`text-lg font-bold ${Number(vistaPrevia.nuevo_total) > Number(vistaPrevia.viejo_total) ? 'text-amber-600' : 'text-green-600'}`}>
											{Number(vistaPrevia.nuevo_total) > Number(vistaPrevia.viejo_total) ? '+' : ''}
											{(Number(vistaPrevia.nuevo_total) - Number(vistaPrevia.viejo_total)).toFixed(2)}€
										</p>
									</div>

									{/* Noches */}
									{(vistaPrevia.extra_nights > 0 || vistaPrevia.removed_nights > 0) && (
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estancia</p>
											<p className="text-sm font-semibold text-gray-700 h-7 flex items-center">
														{(() => {
															const extra = Number(vistaPrevia.extra_nights || 0);
															const removed = Number(vistaPrevia.removed_nights || 0);
															const count = extra > 0 ? extra : removed;
															const sign = extra > 0 ? `+` : `-`;
															const label = Math.abs(count) === 1 ? 'noche' : 'noches';
															return `${sign}${count} ${label}`;
														})()}
													</p>
										</div>
									)}
								</div>

								{/* Badge de Disponibilidad */}
								<div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-tight shadow-sm ${vistaPrevia.available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
									{vistaPrevia.available ? (
										<><CheckIcon className="w-3.5 h-3.5" /> Disponible</>
									) : (
										<><XMarkIcon className="w-3.5 h-3.5" /> Sin Cupo</>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</form>
		</div>
	);
}
