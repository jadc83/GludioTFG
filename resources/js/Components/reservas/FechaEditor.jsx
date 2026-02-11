import { useState, useEffect } from 'react';
import axios from 'axios';
import { emitToast } from '@/utils/toast';
import { t } from '@/i18n';
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
	clearPreview = null,
	noWrapper = false,
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
		if (!checkIn || !checkOut) return emitToast(t('toasts.fill_both_dates'), 'error');
		if (new Date(checkIn) >= new Date(checkOut)) return emitToast(t('toasts.checkout_must_be_after'), 'error');

		setSaving(true);
		try {
if (!esFechaOriginal(checkIn, checkOut)) {
						console.log('--- [FechaEditor] Solicitud de confirmacion de fechas:', { checkIn, checkOut });
						console.log('--- [FechaEditor] typeof onRequestConfirmDates:', typeof onRequestConfirmDates);
						if (typeof onRequestConfirmDates === 'function') {
							try {
								onRequestConfirmDates(checkIn, checkOut);
							} catch (err) {
								console.error('--- [FechaEditor] onRequestConfirmDates threw:', err);
								try { window.dispatchEvent(new CustomEvent('debugOnRequestConfirmDatesError', { detail: { error: String(err), checkIn, checkOut } })); } catch (e) {}
							}
							setSaving(false);
							return;
						} else {
							console.warn('--- [FechaEditor] onRequestConfirmDates not provided, dispatching fallback event');
							try { window.dispatchEvent(new CustomEvent('showModalFechasFallback', { detail: { checkIn, checkOut } })); } catch (e) {}
							setSaving(false);
							return;
						}
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
			emitToast(t('toasts.dates_updated'), 'success');
			if (refresh) await refresh();
		} catch (err) {
			emitToast(err.response?.data?.message || t('toasts.could_not_update'), 'error');
		} finally {
			setSaving(false);
		}
	};

	const formContent = (
		<form onSubmit={onSave} className={`${noWrapper ? 'w-full p-0' : 'p-5 w-full'}`}>
				<div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
					{/* Inputs de Fecha */}
					<div className="grid grid-cols-2 gap-4 flex-1 w-full">
						<div className="space-y-1">
							<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('edit_reserva.checkin_label')}</label>
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
							<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('edit_reserva.checkout_label')}</label>
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
							className="p-2.5 bg-black text-white rounded-lg transition-all hover:bg-gray-800"
							title="Restablecer fechas originales"
						>
							<ArrowPathIcon className="w-5 h-5" />
						</button>

						{!esFechaOriginal(checkIn, checkOut) ? (
							<button
								type="submit"
								disabled={saving}
								className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7a0202] hover:bg-[#5f0101] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
							>
								{saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
								<span>{saving ? t('actions_extra.saving') : t('actions_extra.update')}</span>
							</button>
						) : (
							<button type="button" disabled className="px-6 py-2.5 bg-gray-50 text-gray-400 text-sm font-semibold rounded-lg border border-gray-200 cursor-not-allowed italic">
								{t('actions_extra.no_changes')}
							</button>
						)}
					</div>
				</div>

				{/* Panel de Vista Previa (Solo aparece si hay cambios) */}
				{(cargandoVistaPrevia || previewLoaded || errorVistaPrevia) && (
					<div className={`mt-5 p-4 rounded-lg border ${errorVistaPrevia ? 'bg-red-50 border-red-100' : 'bg-[#7a0202]/8 border-[#7a0202]/30'}`}>
						{cargandoVistaPrevia ? (
							<div className="flex items-center gap-3 text-sm text-[#7a0202] font-medium">
								<ArrowPathIcon className="w-4 h-4 animate-spin" />
								{t('actions_extra.loading_preview')}
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
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Incremento en factura</p>
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
								<div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-tight shadow-sm">
									{vistaPrevia.available ? (
										<CheckIcon className="w-6 h-6 text-green-500" aria-hidden="true" />
									) : (
										<XMarkIcon className="w-6 h-6 text-red-500" aria-hidden="true" />
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</form>
	);

	if (noWrapper) return formContent;

	return (
		<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
			{formContent}
		</div>
	);
}
