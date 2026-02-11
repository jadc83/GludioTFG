import { useState, useMemo } from 'react';
import { ArrowLeftIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import ModalGaleria from '@/Components/reservas/modales/ModalGaleria';
import ReservaBreadcrumbs from '@/Components/reservas/utilidades/ReservaBreadcrumbs';
import TarifasSelector from '@/Components/reservas/formularios/TarifasSelector';
import TarjetaHabitacion from '@/Components/reservas/utilidades/TarjetaHabitacion';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import Boton from '@/Components/UI/Boton';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import MobileStickyBar from '@/Components/reservas/utilidades/MobileStickyBar';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import '../../../../css/paso2Habitaciones.css';
import { t } from '@/i18n';

export default function Paso2Habitaciones({
	estaCargandoHabitaciones,
	habitacionesSeleccionadas,
	agruparHabitacionesPorTipo,
	getImagen,
	actualizarSeleccionHabitacion,
	getTotalHabitaciones,
	avanzarPaso,
	retrocederPaso,
	numHuespedes,
	rango,
	preciosPorTipo = {},
	actualizarTarifas = () => {},
	selectedTarifas = {},
	tarifas = [],
}) {
	const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
	const [mostrarTarifasMobile, setMostrarTarifasMobile] = useState(false);

	const fotosPorTipo = useMemo(
		() => ({
			doble: [
				'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
				'https://images.unsplash.com/photo-1578665478519-e21cc028cb29?w=800&q=80',
			],
			suite: [
				'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
				'https://images.unsplash.com/photo-1578665478519-e21cc028cb29?w=800&q=80',
			],
			familiar: [
				'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
				'https://images.unsplash.com/photo-1578665478519-e21cc028cb29?w=800&q=80',
			],
		}),
		[]
	);

	const tipos = agruparHabitacionesPorTipo(numHuespedes);
	const totalSeleccionado = getTotalHabitaciones();
	const entradasVisibles = Object.entries(tipos).filter(([, info]) => (info.cantidad || 0) > 0);
	const totalDisponibles = Object.values(tipos).reduce((sum, info) => sum + (info.cantidad || 0), 0);
	const puedoSeleccionarMas =
		totalSeleccionado < totalDisponibles && totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;

	return (
		<div className="paso2-habitaciones relative flex flex-col h-screen md:h-auto max-h-[100dvh] md:max-h-none mx-auto w-full max-w-5xl bg-white md:rounded-xl md:border md:border-gray-200 md:shadow-lg overflow-hidden">
			<header className="flex-none px-4 py-3 sm:px-6 sm:py-5 border-b bg-white z-30">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900 leading-tight">{t('paso2.title')}</h1>
						<p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-0.5">{t('paso2.step_label')}</p>
					</div>
					<div className="hidden md:block">
						<ReservaBreadcrumbs activeIndex={1} separator="chevron" textClass="text-sm" />
					</div>
				</div>
			</header>

			<div className="md:hidden flex-none px-4 py-2.5 bg-gray-50 border-b flex justify-between items-center">
				<div className="flex flex-col">
					<span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">{t('paso2.regimen')}</span>
					<span className="text-[10px] font-bold text-gray-700 truncate max-w-[150px]">{tarifas.find(t => t.id === selectedTarifas.id)?.nombre || 'Estándar'}</span>
				</div>
				<button
					onClick={() => setMostrarTarifasMobile(!mostrarTarifasMobile)}
					className="flex items-center gap-1.5 text-[10px] font-black text-[#7a0202] uppercase bg-white px-4 py-2.5 rounded-xl border border-red-100 shadow-sm active:scale-95 transition-all"
				>
					<AdjustmentsHorizontalIcon className="h-4 w-4" />
					{mostrarTarifasMobile ? t('actions.close') : t('paso2.adjust')}
				</button>
			</div>

			<main className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
				<div className="flex-1 p-4 md:p-6 bg-gray-50/40 overflow-y-auto custom-scrollbar">
					{mostrarTarifasMobile && (
						<div className="md:hidden sticky top-0 mb-6 p-5 rounded-2xl bg-white border-2 border-[#7a0202] shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-200">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-[11px] font-black uppercase text-gray-900">{t('paso2.options_stay')}</h3>
								<button onClick={() => setMostrarTarifasMobile(false)} className="text-[10px] font-bold text-gray-400 uppercase">{t('actions.close')}</button>
							</div>
							<TarifasSelector tarifas={tarifas} seleccion={selectedTarifas} onChange={(val) => { actualizarTarifas(val); setMostrarTarifasMobile(false); }} />
						</div>
					)}

					<div className="space-y-4 pb-40 md:pb-0">
						{estaCargandoHabitaciones ? (
							<div className="py-24 flex flex-col items-center justify-center">
								<LoadingSpinner size="lg" />
								<p className="mt-4 text-xs text-gray-400 font-bold uppercase tracking-widest text-center">
									{t('paso2.searching_availability').split('\\n').map((line, i) => (<span key={i}>{line}<br/></span>))}
								</p>
							</div>
						) : (
							entradasVisibles.map(([tipo, info]) => (
								<TarjetaHabitacion
									key={tipo}
									tipo={tipo}
									info={info}
									isSelected={habitacionesSeleccionadas[tipo]?.cantidad > 0}
									preciosPorTipo={preciosPorTipo}
									actualizarSeleccionHabitacion={actualizarSeleccionHabitacion}
									puedoSeleccionarMas={puedoSeleccionarMas}
									getImagen={getImagen}
									setImagenModalAbierto={setImagenModalAbierto}
									fullHeight={false}
								/>
							))
						)}
					</div>
				</div>

				<aside className="hidden md:flex w-80 border-l border-gray-100 bg-white flex-col">
					<div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
						<div className="rounded-xl border border-gray-100 p-5 bg-gray-50/50">
							<TarifasSelector tarifas={tarifas} seleccion={selectedTarifas} onChange={actualizarTarifas} />
						</div>
						<div className="mt-8 border-t border-dashed border-gray-200 pt-6">
							<DetalleSubtotal habitacionesSeleccionadas={habitacionesSeleccionadas} rango={rango} tipos={tipos} preciosPorTipo={preciosPorTipo} tarifasSeleccionadas={selectedTarifas} tarifas={tarifas} />
						</div>
					</div>
					<div className="p-5 bg-white border-t border-gray-100">
						<Boton variant="primary" className="w-full bg-[#7a0202] hover:bg-black py-4 text-[11px] font-black tracking-[0.2em] uppercase" onClick={avanzarPaso} disabled={totalSeleccionado === 0}>
							{t('actions.next')} {totalSeleccionado > 0 && `(${totalSeleccionado})`}
						</Boton>
						<button onClick={retrocederPaso} className="w-full mt-4 text-[9px] font-black text-gray-400 uppercase hover:text-[#7a0202] transition-colors">← {t('actions.back_change_dates')}</button>
					</div>
				</aside>
			</main>

			<div className="md:hidden relative z-50">
				<MobileStickyBar>
					<div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-3 py-1">
						<div className="flex flex-col">
							<span className="text-[9px] uppercase font-black text-gray-400 leading-none mb-1">{t('paso2.subtotal')}</span>
							<div className="text-lg font-black text-gray-900 leading-none tracking-tight">
								<DetalleSubtotal soloSubtotal={true} habitacionesSeleccionadas={habitacionesSeleccionadas} rango={rango} tipos={tipos} preciosPorTipo={preciosPorTipo} tarifasSeleccionadas={selectedTarifas} tarifas={tarifas} />
							</div>
						</div>

						<div className="flex items-center gap-2">
							<button onClick={retrocederPaso} className="h-12 w-12 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm active:bg-gray-50 active:scale-95 transition-all" aria-label={t('actions.back_change_dates')}>
								<ArrowLeftIcon className="h-5 w-5" />
							</button>
							<Boton className={`h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${totalSeleccionado > 0 ? 'bg-[#7a0202] text-white shadow-red-900/30' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`} onClick={avanzarPaso} disabled={totalSeleccionado === 0}>
								{t('actions.next')} {totalSeleccionado > 0 && `(${totalSeleccionado})`}
							</Boton>
						</div>
					</div>
				</MobileStickyBar>
			</div>

			<ModalGaleria titulo={imagenModalAbierto} fotos={fotosPorTipo[imagenModalAbierto] || []} abierto={!!imagenModalAbierto} onCerrar={() => setImagenModalAbierto(null)} />
		</div>
	);
}
