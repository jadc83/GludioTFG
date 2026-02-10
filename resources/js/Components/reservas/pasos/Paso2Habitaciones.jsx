import { useState, useMemo } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Componentes
import ModalGaleria from '@/Components/reservas/modales/ModalGaleria';
import ReservaBreadcrumbs from '@/Components/reservas/utilidades/ReservaBreadcrumbs';
import TarifasSelector from '@/Components/reservas/formularios/TarifasSelector';
import TarjetaHabitacion from '@/Components/reservas/utilidades/TarjetaHabitacion';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import Boton from '@/Components/UI/Boton';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';

// Utilidades y Estilos
import { CONFIG_RESERVAS } from '@/utils/constantes';
import '../../../../css/paso2Habitaciones.css';

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

	// Mock de fotos (Idealmente esto vendría de una constante o API)
	const fotosPorTipo = useMemo(() => ({
		doble: [
			'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
			'https://images.unsplash.com/photo-1578665478519-e21cc028cb29?w=800&q=80',
			'https://images.unsplash.com/photo-1540932014986-7db9c3030eb7?w=800&q=80',
		],
		suite: [
			'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
			'https://images.unsplash.com/photo-1578665478519-e21cc028cb29?w=800&q=80',
			'https://images.unsplash.com/photo-1540932014986-7db9c3030eb7?w=800&q=80',
		],
		familiar: [
			'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
			'https://images.unsplash.com/photo-1578665478519-e21cc028cb29?w=800&q=80',
			'https://images.unsplash.com/photo-1540932014986-7db9c3030eb7?w=800&q=80',
		],
	}), []);

	const tipos = agruparHabitacionesPorTipo(numHuespedes);
	const totalSeleccionado = getTotalHabitaciones();

	const entradasVisibles = Object.entries(tipos).filter(
		([, info]) => (info.cantidad || 0) > 0,
	);

	const totalDisponibles = Object.values(tipos).reduce(
		(sum, info) => sum + (info.cantidad || 0),
		0,
	);

	const puedoSeleccionarMas =
		totalSeleccionado < totalDisponibles &&
		totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;

	return (
		<div className="paso2-habitaciones relative z-10 mx-auto w-full max-w-5xl flex-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">

			{/* HEADER */}
			<header className="px-4 py-4 sm:px-6 sm:py-5 border-b bg-white">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-extrabold tracking-tight text-gray-900">
							¿Dónde quieres <span className="text-[#7a0202]">dormir?</span>
						</h1>
						<p className="mt-1 text-xs text-gray-500 uppercase tracking-wide">
							Paso 2 — Elige tipo de habitación
						</p>
					</div>
					<div className="hidden md:block">
						<ReservaBreadcrumbs activeIndex={1} separator="chevron" textClass="text-sm" />
					</div>
				</div>
			</header>

			{/* CONTENT */}
			<main className="flex flex-col md:flex-row min-h-[500px]">

				{/* Listado de Habitaciones */}
				<div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50/30">
					<div className="space-y-4">
						{estaCargandoHabitaciones ? (
							<div className="py-20 flex flex-col items-center justify-center">
								<LoadingSpinner />
								<p className="mt-4 text-sm text-gray-500">Buscando disponibilidad...</p>
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

				{/* Sidebar */}
				<aside className="relative w-full border-t md:border-t-0 md:w-80 md:border-l md:border-gray-100 bg-white flex flex-col">
					<div className="p-4 md:p-6 flex-1">

						<div className="mt-4 rounded-lg border border-gray-100 p-3 bg-gray-50">
							<TarifasSelector
								tarifas={tarifas}
								seleccion={selectedTarifas}
								onChange={actualizarTarifas}
							/>
						</div>

						<div className="mt-6 border-t pt-4">
							<DetalleSubtotal
								habitacionesSeleccionadas={habitacionesSeleccionadas}
								rango={rango}
								tipos={tipos}
								preciosPorTipo={preciosPorTipo}
								tarifasSeleccionadas={selectedTarifas}
								tarifas={tarifas}
							/>
						</div>
					</div>

					{/* Desktop Footer (Sticky en sidebar) */}
					<div className="hidden md:block sticky bottom-0 bg-white border-t p-4">
						<div className="flex flex-col gap-3">
							<div className="flex justify-between items-center text-xs text-gray-600">
								<span>Seleccionadas:</span>
								<span className="font-bold text-gray-900">{totalSeleccionado}</span>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Boton variant="outline" onClick={retrocederPaso}>
									Volver
								</Boton>
								<Boton
									variant="primary"
									className="bg-[#7a0202] hover:bg-[#5f0101]"
									onClick={avanzarPaso}
									disabled={totalSeleccionado === 0}
								>
									Continuar
								</Boton>
							</div>
						</div>
					</div>
				</aside>
			</main>

			{/* Mobile Sticky Bar */}
			<div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
				<div className="max-w-5xl mx-auto flex items-center justify-between">
					<div className="flex flex-col">
						<span className="text-[10px] uppercase font-bold text-gray-500">Total aprox.</span>
						<div className="text-base font-extrabold text-gray-900">
							<DetalleSubtotal
								soloSubtotal={true}
								habitacionesSeleccionadas={habitacionesSeleccionadas}
								rango={rango}
								tipos={tipos}
								preciosPorTipo={preciosPorTipo}
								tarifasSeleccionadas={selectedTarifas}
								tarifas={tarifas}
							/>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Boton variant="outline" size="sm" onClick={retrocederPaso}>
							<ArrowLeftIcon className="h-4 w-4" />
						</Boton>
						<Boton
							size="md"
							className="bg-[#7a0202] hover:bg-[#5f0101] text-white font-bold"
							onClick={avanzarPaso}
							disabled={totalSeleccionado === 0}
						>
							Siguiente ({totalSeleccionado})
						</Boton>
					</div>
				</div>
			</div>

			{/* MODAL GALERIA */}
			<ModalGaleria
				titulo={imagenModalAbierto}
				fotos={fotosPorTipo[imagenModalAbierto] || []}
				abierto={!!imagenModalAbierto}
				onCerrar={() => setImagenModalAbierto(null)}
			/>
		</div>
	);
}
