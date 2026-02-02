import ModalGaleria from '@/Components/reservas/modales/ModalGaleria';
import ReservaBreadcrumbs from '@/Components/reservas/ReservaBreadcrumbs';
import TarifasSelector from '@/Components/reservas/TarifasSelector';
import TarjetaHabitacion from '@/Components/reservas/TarjetaHabitacion';
import DetalleSubtotal from '@/Components/reservas/utilidades/DetalleSubtotal';
import Boton from '@/Components/UI/Boton';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { CONFIG_RESERVAS } from '@/utils/constantes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
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

    const tipos = agruparHabitacionesPorTipo(numHuespedes);
    const totalSeleccionado = getTotalHabitaciones();
    const entradasVisibles = Object.entries(tipos).filter(
        ([, info]) => (info.cantidad || 0) > 0,
    );
    const isThree = entradasVisibles.length === 3;
    const totalDisponibles = Object.values(tipos).reduce(
        (sum, info) => sum + (info.cantidad || 0),
        0,
    );
    const puedoSeleccionarMas =
        totalSeleccionado < totalDisponibles &&
        totalSeleccionado < CONFIG_RESERVAS.MAX_HABITACIONES_POR_RESERVA;

    return (
        <div className="paso2-habitaciones relative z-10 mx-auto flex h-auto max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            {/* HEADER COMPACTO */}
            <header className="flex-none border-b border-gray-100 bg-white px-8 py-5 md:px-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-xl font-black uppercase leading-none tracking-tighter text-gray-900">
                            ¿DONDE QUIERES{' '}
                            <span className="text-[#7a0202]">DORMIR?</span>
                        </h1>
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
                            Paso 2 / Elige tu tipo de habitación
                        </p>
                    </div>
                    <ReservaBreadcrumbs
                        activeIndex={1}
                        separator="chevron"
                        textClass="text-[9px]"
                    />
                </div>
            </header>

            <main className="flex flex-none flex-col overflow-hidden bg-gradient-to-r from-red-900 to-red-800 md:flex-1 md:flex-row">
                <div className={`custom-scrollbar flex-1 ${isThree ? 'overflow-visible p-2 md:p-4' : 'overflow-y-auto p-4 md:p-6'}`}>
                    <div className={`mx-auto my-4 max-w-4xl h-full ${isThree ? 'flex flex-col justify-between' : 'space-y-6'}`}>
                        {' '}
                        {estaCargandoHabitaciones ? (
                            <LoadingSpinner />
                        ) : (
                            entradasVisibles.map(([tipo, info]) => {
                                const isSelected =
                                    habitacionesSeleccionadas[tipo]?.cantidad >
                                    0;
                                return (
                                    <div key={tipo} className={isThree ? 'flex-1 flex items-stretch w-full' : 'w-full'}>
                                        <TarjetaHabitacion
                                            tipo={tipo}
                                            info={info}
                                            isSelected={isSelected}
                                            preciosPorTipo={preciosPorTipo}
                                            actualizarSeleccionHabitacion={
                                                actualizarSeleccionHabitacion
                                            }
                                            puedoSeleccionarMas={
                                                puedoSeleccionarMas
                                            }
                                            getImagen={getImagen}
                                            setImagenModalAbierto={
                                                setImagenModalAbierto
                                            }
                                            fullHeight={isThree}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <aside className="flex w-full flex-none flex-col md:w-96 bg-gradient-to-r from-red-900 to-red-800 text-white md:border-l md:border-transparent">
                    <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                        <div className="border-l-4 border-white/20 pl-4">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
                                Configuración
                            </h5>
                            <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-white/80">
                                Servicios Adicionales
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/60 p-5 shadow-sm transition-all hover:bg-white hover:shadow-md">
                            <TarifasSelector
                                tarifas={tarifas}
                                seleccion={selectedTarifas}
                                onChange={actualizarTarifas}
                            />
                        </div>
                    </div>

                    <div className="border-t border-transparent bg-gradient-to-r from-red-900 to-red-800 p-6">
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
                <div className="footer-actions mx-auto flex max-w-7xl items-center justify-between">
                    <Boton
                        variant="ghost"
                        size="sm"
                        icon={ArrowLeftIcon}
                        onClick={retrocederPaso}
                    >
                        Volver
                    </Boton>
                    <Boton
                        variant="primary"
                        color="danger"
                        size="md"
                        onClick={avanzarPaso}
                        disabled={totalSeleccionado === 0}
                    >
                        Siguiente Paso →
                    </Boton>
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
