import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';
import TarifasSelector from '@/Components/reservas/TarifasSelector';
import ModalGaleria from '@/Components/reservas/modales/ModalGaleria';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import {
    ArrowLeftIcon,
    InformationCircleIcon,
    MinusIcon,
    PlusIcon,
    UsersIcon,
    WifiIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

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
}) {
    const [imagenModalAbierto, setImagenModalAbierto] = useState(null);
    const [tarifas, setTarifas] = useState([]);

    // Fotos por tipo de habitación
    const fotosPorTipo = {
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
    };

    useEffect(() => {
        console.log('Paso2 - selectedTarifas prop recibido:', selectedTarifas);
    }, [selectedTarifas]);

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

    useEffect(() => {
        let mounted = true;
        fetch('/api/tarifas')
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (mounted) setTarifas(data || []);
            });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        /* CAMBIO CLAVE: h-auto en lugar de h-full para que el modal se encoja si hay poco contenido */
        <div className="relative z-10 mx-auto flex h-auto max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            {/* HEADER COMPACTO */}
            <header className="flex-none border-b border-gray-100 bg-white px-8 py-5 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-xl font-black uppercase leading-none tracking-tighter text-gray-900">
                            SELECCIÓN DE{' '}
                            <span className="text-[#7a0202]">ACTIVOS</span>
                        </h1>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
                            Step 02 / Disponibilidad
                        </p>
                    </div>
                    <ReservaBreadcrumbs
                        activeIndex={1}
                        separator="chevron"
                        textClass="text-[9px]"
                    />
                </div>
            </header>

            {/* MAIN: Ajustado para no forzar altura mínima innecesaria */}
            <main className="flex flex-none flex-col overflow-hidden bg-gris md:flex-1 md:flex-row">
                {/* LISTADO DE TARJETAS */}
                <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto mt-8 max-w-4xl space-y-6 pb-4">
                        {' '}
                        {/* Padding bottom reducido; espacio superior aumentado y mayor separación entre tarjetas */}
                        {estaCargandoHabitaciones ? (
                            <div className="py-12 text-center">
                                <span className="loading loading-spinner text-[#7a0202]"></span>
                            </div>
                        ) : (
                            entradasVisibles.map(([tipo, info]) => {
                                const isSelected =
                                    habitacionesSeleccionadas[tipo]?.cantidad >
                                    0;
                                return (
                                    <article
                                        key={tipo}
                                        className={`group flex flex-col rounded-xl border bg-white transition-all duration-300 md:flex-row ${isSelected ? 'border-[#7a0202] shadow-md ring-1 ring-[#7a0202]' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
                                    >
                                        <div className="relative h-28 w-full shrink-0 bg-gray-900 md:h-32 md:w-48">
                                            <img
                                                src={getImagen(tipo)}
                                                className="h-full w-full object-cover opacity-90"
                                                alt={tipo}
                                            />
                                            <button
                                                onClick={() =>
                                                    setImagenModalAbierto(tipo)
                                                }
                                                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity group-hover:opacity-100 md:opacity-0"
                                            >
                                                <InformationCircleIcon className="h-6 w-6 text-white" />
                                            </button>
                                        </div>

                                        <div className="flex flex-1 flex-col justify-center p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                                        {tipo}
                                                    </h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-gray-400">
                                                            <UsersIcon className="h-3 w-3" />{' '}
                                                            {
                                                                info.capacidadMaxima
                                                            }{' '}
                                                            PAX
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-gray-400">
                                                            <WifiIcon className="h-3 w-3" />{' '}
                                                            FIBER
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-[#7a0202]">
                                                            {preciosPorTipo[
                                                                tipo
                                                            ] ??
                                                                info.precioEntreNoche ??
                                                                info.precioTipo ??
                                                                info.precioMinimo}
                                                            €
                                                        </p>
                                                        <p className="text-[7px] font-bold uppercase tracking-tighter text-gray-400">
                                                            Precio medio por
                                                            noche
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                                                        {isSelected ? (
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() =>
                                                                        actualizarSeleccionHabitacion(
                                                                            tipo,
                                                                            'cantidad',
                                                                            0,
                                                                        )
                                                                    }
                                                                    className="p-2 text-gray-400 transition-colors hover:text-red-700"
                                                                >
                                                                    <MinusIcon className="h-4 w-4 stroke-[3]" />
                                                                </button>
                                                                <span className="rounded border border-green-100 bg-green-50 px-3 py-1 text-[10px] font-black uppercase text-green-600">
                                                                    Listo
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                disabled={
                                                                    !puedoSeleccionarMas
                                                                }
                                                                onClick={() =>
                                                                    actualizarSeleccionHabitacion(
                                                                        tipo,
                                                                        'cantidad',
                                                                        1,
                                                                    )
                                                                }
                                                                className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#7a0202] active:scale-95 disabled:opacity-20"
                                                            >
                                                                <PlusIcon className="h-3 w-3 stroke-[3]" />{' '}
                                                                Seleccionar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ASIDE: Selector de Tarifas (w-96 para que sea grande) */}
                <aside className="flex w-full flex-none flex-col border-t border-gray-200 bg-gris md:w-96 md:border-l md:border-t-0">
                    <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                        <div className="border-l-4 border-[#7a0202] pl-4">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-900">
                                Configuración
                            </h5>
                            <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-gray-400">
                                Servicios Adicionales
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white/60 p-5 shadow-sm transition-all hover:bg-white hover:shadow-md">
                            <TarifasSelector
                                tarifas={tarifas}
                                seleccion={selectedTarifas}
                                onChange={actualizarTarifas}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 bg-gris p-6">
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
                </aside>
            </main>

            {/* FOOTER: Reducido en padding vertical */}
            <footer className="flex-none border-t border-gray-100 bg-white px-10 py-5">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button
                        onClick={retrocederPaso}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="h-3 w-3" /> Volver
                    </button>
                    <button
                        onClick={avanzarPaso}
                        disabled={totalSeleccionado === 0}
                        className="rounded-lg bg-[#7a0202] px-12 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-red-900/20 transition-all hover:bg-black active:scale-95 disabled:opacity-20"
                    >
                        Siguiente Paso →
                    </button>
                </div>
            </footer>

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
