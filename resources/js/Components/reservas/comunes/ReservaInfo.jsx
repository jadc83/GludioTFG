import React from 'react';
import { formatearFecha, formatearMoneda, formatearHora } from '@/utils/formatters';

export default function ReservaInfo({ reserva, total, onSolicitarReembolso }) {
	if (!reserva) return null;

	const qrData = encodeURIComponent(reserva.localizador || '');
	const qrSize = 160;
	const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${qrData}`;

	const status = String(reserva?.status || '').toLowerCase();
	const isCheckedIn = status === 'checked_in';
	const isCheckedOut = status === 'checked_out';

	return (
		<section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
			{/* Cabecera Principal */}
			<div className="border-b border-gray-100 bg-gray-50/50 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-xl font-black text-gray-900">Resumen de reserva</h3>
						<p className="text-sm text-gray-500">
							ID Localizador: <span className="font-mono font-bold text-rose-700 uppercase">{reserva.localizador}</span>
						</p>
					</div>
					<div className="text-right">
						<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
							reserva?.pago === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
						}`}>
							{reserva?.pago === 'pagado' ? 'Abonado' : 'Pendiente'}
						</span>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-12 gap-0">
				{/* Columna Izquierda: Información Detallada */}
				<div className="col-span-12 p-6 lg:col-span-8">
					<div className="grid grid-cols-2 gap-8">
						{/* Huésped */}
						<div className="col-span-2">
							<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Huésped Principal</p>
							<p className="mt-1 text-lg font-bold text-gray-900">{reserva.reservable?.name ?? reserva.cliente?.name ?? 'N/A'}</p>
							<div className="mt-1 flex gap-3 text-sm text-gray-500">
								<span>{reserva.cliente?.email}</span>
								{reserva.cliente?.telefono && <span>• {reserva.cliente.telefono}</span>}
							</div>
						</div>

						{/* Fechas */}
						<div className="rounded-lg border border-gray-100 p-4">
							<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Entrada (Check-In)</p>
							<p className="mt-1 text-base font-bold text-gray-900">{formatearFecha(reserva.check_in)}</p>
							<p className="text-sm text-gray-500">{reserva.check_in_time ?? formatearHora(reserva.check_in)}</p>
						</div>

						<div className="rounded-lg border border-gray-100 p-4">
							<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Salida (Check-Out)</p>
							<p className="mt-1 text-base font-bold text-gray-900">{formatearFecha(reserva.check_out)}</p>
							<p className="text-sm text-gray-500">{reserva.check_out_time ?? formatearHora(reserva.check_out)}</p>
						</div>

						{/* Habitaciones */}
						<div className="col-span-2 mt-2">
							<p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Desglose de Alojamiento</p>
							<div className="space-y-3">
								{reserva.habitaciones?.map((h, i) => {
									const tipo = h.habitacion?.tipo ?? h.tipo ?? 'Habitación';
									const precioTotalHab = h.precio ?? 0;
									const precioNoche = (reserva.noches > 0) ? (precioTotalHab / reserva.noches) : precioTotalHab;
									return (
										<div key={i} className="flex justify-between border-b border-gray-50 pb-2 italic text-gray-700">
											<span className="capitalize font-medium">Habitación {tipo} <span className="not-italic text-xs font-normal text-gray-400">({reserva.noches} nts)</span></span>
											<span className="font-bold">{formatearMoneda(precioNoche)}/nt</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Acciones principales */}
					<div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
						<a
							href={reserva?.localizador ? route('reservas.descargar-comprobante', { localizador: reserva.localizador }) : '#'}
							className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
							onClick={(e) => { if (!reserva?.localizador) e.preventDefault(); }}
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
							Descargar PDF
						</a>

						<div className="flex gap-2">
							{!isCheckedIn && !isCheckedOut && (
								<>
									<button
										onClick={() => (window.location.href = route('scan-qr') + `?localizador=${reserva?.localizador}&action=checkin`)}
										className="rounded-lg bg-rose-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800"
									>
										Realizar Check-In
									</button>
									{reserva?.pago === 'pagado' && onSolicitarReembolso && (
										<button onClick={onSolicitarReembolso} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-red-700 transition">
											Solicitar Reembolso
										</button>
									)}
								</>
							)}
							{isCheckedIn && (
								<button
									onClick={() => (window.location.href = route('scan-qr') + `?localizador=${reserva?.localizador}&action=checkout`)}
									className="rounded-lg border-2 border-rose-700 px-5 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 transition"
								>
									Realizar Check-Out
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Columna Derecha: QR y Totales */}
				<div className="col-span-12 border-l border-gray-100 bg-gray-50/30 p-6 lg:col-span-4">
					<div className="flex flex-col items-center">
						<div className="mb-6 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
							<img src={qrUrl} alt="QR de acceso" className="h-32 w-32" />
							<p className="mt-2 text-center text-[10px] font-bold uppercase text-gray-400 tracking-tighter">Pase de acceso rápido</p>
						</div>

						<div className="w-full space-y-4">
							<div>
								<p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tarifas y Extras</p>
								<div className="space-y-2">
									{(() => {
										const tarifasArr = (reserva.tarifas?.length) ? reserva.tarifas : (reserva.tarifa ? [reserva.tarifa] : []);
										if (tarifasArr.length) {
											return tarifasArr.map((t, idx) => (
												<div key={idx} className="flex justify-between text-sm text-gray-600">
													<span>{t.name ?? t.nombre}</span>
													<span className="font-medium text-gray-900">{t.price ? formatearMoneda(Number(t.price)) : '-'}</span>
												</div>
											));
										}
										return <p className="text-xs text-gray-400 italic">No hay cargos adicionales</p>;
									})()}
								</div>
							</div>

							<div className="mt-6 border-t border-gray-200 pt-4">
								<div className="flex justify-between text-sm text-gray-500">
									<span>Base imponible</span>
									<span>{formatearMoneda(Number(reserva.precio_total ?? total ?? 0))}</span>
								</div>
								<div className="mt-2 flex justify-between items-end">
									<span className="text-sm font-bold text-gray-900 uppercase">Total Final</span>
									<span className="text-2xl font-black text-rose-800 tracking-tight">
										{formatearMoneda(Number(reserva.precio_total ?? total ?? 0))}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
