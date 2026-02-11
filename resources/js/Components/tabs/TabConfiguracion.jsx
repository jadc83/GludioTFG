import HeaderPanel from '@/Components/UI/HeaderPanel';
import ElegirPrecio from '@/Components/utilidades/ElegirPrecio';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import React, { Suspense } from 'react';

const TabCupones = React.lazy(() => import('@/Components/tabs/TabCupones'));

export default function TabConfiguracion({ cupones, tiposHabitacion }) {
    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Precios y Cupones"
                subtitulo="Gestión de tarifas y códigos promocionales"
                icono={Cog6ToothIcon}
            />

            <div className="space-y-8">
                <div>
                    <Suspense
                        fallback={
                            <div className="p-6 text-center">
                                Cargando precios…
                            </div>
                        }
                    >
                        <ElegirPrecio tiposHabitacion={tiposHabitacion} />
                    </Suspense>
                </div>
                <hr className="border-gray-300" />
                <div>
                    <Suspense
                        fallback={
                            <div className="p-6 text-center">
                                Cargando cupones…
                            </div>
                        }
                    >
                        <TabCupones cupones={cupones} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
