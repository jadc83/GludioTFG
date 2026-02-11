import TarifasSelector from '@/Components/reservas/formularios/TarifasSelector';
import ModalGaleria from '@/Components/reservas/modales/ModalGaleria';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import MobileStickyBar from '@/Components/reservas/utilidades/MobileStickyBar';
import ReservaBreadcrumbs from '@/Components/reservas/utilidades/ReservaBreadcrumbs';
import TarjetaHabitacion from '@/Components/reservas/utilidades/TarjetaHabitacion';
import Boton from '@/Components/UI/Boton';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { t } from '@/i18n';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import {
    AdjustmentsHorizontalIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
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
        [],
    );

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
        <div className="paso2-habitaciones relative mx-auto flex h-screen max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white md:h-auto md:max-h-none md:rounded-xl md:border md:border-gray-200 md:shadow-lg">
            <header className="z-30 flex-none border-b bg-white px-4 py-3 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-extrabold leading-tight tracking-tight text-gray-900 sm:text-lg">
                            {t('paso2.title')}
                        </h1>
                        <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {t('paso2.step_label')}
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <ReservaBreadcrumbs
                            activeIndex={1}
                            separator="chevron"
                            textClass="text-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="flex flex-none items-center justify-between border-b bg-gray-50 px-4 py-2.5 md:hidden">
                <div className="flex flex-col">
                    <span className="mb-1 text-[8px] font-black uppercase leading-none text-gray-400">
                        {t('paso2.regimen')}
                    </span>
                    <span className="max-w-[150px] truncate text-[10px] font-bold text-gray-700">
                        {tarifas.find((t) => t.id === selectedTarifas.id)
                            ?.nombre || 'Estándar'}
                    </span>
                </div>
                <button
                    onClick={() =>
                        setMostrarTarifasMobile(!mostrarTarifasMobile)
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-4 py-2.5 text-[10px] font-black uppercase text-[#7a0202] shadow-sm transition-all active:scale-95"
                >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    {mostrarTarifasMobile
                        ? t('actions.close')
                        : t('paso2.adjust')}
                </button>
            </div>

            <main className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
                <div className="custom-scrollbar flex-1 overflow-y-auto bg-gray-50/40 p-4 md:p-6">
                    {mostrarTarifasMobile && (
                        <div className="animate-in fade-in zoom-in-95 sticky top-0 z-40 mb-6 rounded-2xl border-2 border-[#7a0202] bg-white p-5 shadow-2xl duration-200 md:hidden">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase text-gray-900">
                                    {t('paso2.options_stay')}
                                </h3>
                                <button
                                    onClick={() =>
                                        setMostrarTarifasMobile(false)
                                    }
                                    className="text-[10px] font-bold uppercase text-gray-400"
                                >
                                    {t('actions.close')}
                                </button>
                            </div>
                            <TarifasSelector
                                tarifas={tarifas}
                                seleccion={selectedTarifas}
                                onChange={(val) => {
                                    actualizarTarifas(val);
                                    setMostrarTarifasMobile(false);
                                }}
                            />
                        </div>
                    )}

                    <div className="space-y-4 pb-40 md:pb-0">
                        {estaCargandoHabitaciones ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <LoadingSpinner size="lg" />
                                <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                    {t('paso2.searching_availability')
                                        .split('\\n')
                                        .map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                <br />
                                            </span>
                                        ))}
                                </p>
                            </div>
                        ) : (
                            entradasVisibles.map(([tipo, info]) => (
                                <TarjetaHabitacion
                                    key={tipo}
                                    tipo={tipo}
                                    info={info}
                                    isSelected={
                                        habitacionesSeleccionadas[tipo]
                                            ?.cantidad > 0
                                    }
                                    preciosPorTipo={preciosPorTipo}
                                    actualizarSeleccionHabitacion={
                                        actualizarSeleccionHabitacion
                                    }
                                    puedoSeleccionarMas={puedoSeleccionarMas}
                                    getImagen={getImagen}
                                    setImagenModalAbierto={
                                        setImagenModalAbierto
                                    }
                                    fullHeight={false}
                                />
                            ))
                        )}
                    </div>
                </div>

                <aside className="hidden w-80 flex-col border-l border-gray-100 bg-white md:flex">
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                            <TarifasSelector
                                tarifas={tarifas}
                                seleccion={selectedTarifas}
                                onChange={actualizarTarifas}
                            />
                        </div>
                        <div className="mt-8 border-t border-dashed border-gray-200 pt-6">
                            <DetalleSubtotal
                                habitacionesSeleccionadas={
                                    habitacionesSeleccionadas
                                }
                                rango={rango}
                                tipos={tipos}
                                preciosPorTipo={preciosPorTipo}
                                tarifasSeleccionadas={selectedTarifas}
                                tarifas={tarifas}
                            />
                        </div>
                    </div>
                    <div className="border-t border-gray-100 bg-white p-5">
                        <Boton
                            variant="primary"
                            className="w-full bg-[#7a0202] py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black"
                            onClick={avanzarPaso}
                            disabled={totalSeleccionado === 0}
                        >
                            {t('actions.next')}{' '}
                            {totalSeleccionado > 0 && `(${totalSeleccionado})`}
                        </Boton>
                        <button
                            onClick={retrocederPaso}
                            className="mt-4 w-full text-[9px] font-black uppercase text-gray-400 transition-colors hover:text-[#7a0202]"
                        >
                            ← {t('actions.back_change_dates')}
                        </button>
                    </div>
                </aside>
            </main>

            <div className="relative z-50 md:hidden">
                <MobileStickyBar>
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-3 py-1">
                        <div className="flex flex-col">
                            <span className="mb-1 text-[9px] font-black uppercase leading-none text-gray-400">
                                {t('paso2.subtotal')}
                            </span>
                            <div className="text-lg font-black leading-none tracking-tight text-gray-900">
                                <DetalleSubtotal
                                    soloSubtotal={true}
                                    habitacionesSeleccionadas={
                                        habitacionesSeleccionadas
                                    }
                                    rango={rango}
                                    tipos={tipos}
                                    preciosPorTipo={preciosPorTipo}
                                    tarifasSeleccionadas={selectedTarifas}
                                    tarifas={tarifas}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={retrocederPaso}
                                className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all active:scale-95 active:bg-gray-50"
                                aria-label={t('actions.back_change_dates')}
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <Boton
                                className={`h-12 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${totalSeleccionado > 0 ? 'bg-[#7a0202] text-white shadow-red-900/30' : 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'}`}
                                onClick={avanzarPaso}
                                disabled={totalSeleccionado === 0}
                            >
                                {t('actions.next')}{' '}
                                {totalSeleccionado > 0 &&
                                    `(${totalSeleccionado})`}
                            </Boton>
                        </div>
                    </div>
                </MobileStickyBar>
            </div>

            <ModalGaleria
                titulo={imagenModalAbierto}
                fotos={fotosPorTipo[imagenModalAbierto] || []}
                abierto={!!imagenModalAbierto}
                onCerrar={() => setImagenModalAbierto(null)}
            />
        </div>
    );
}
