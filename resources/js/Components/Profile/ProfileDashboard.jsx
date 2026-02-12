import { usePage } from '@inertiajs/react';
import usePerfilDashboard from '../../hooks/usePerfilDashboard';
import Indicadores from './Indicadores';
import TareasCompletadas from './TareasCompletadas';
import TurnosProximos from './TurnosProximos';

export default function ProfileDashboard({ empleado = null, habitaciones = [], canViewTareas = false }) {
    const { proximos, completadas, conteoActivas, cargando, refrescar, formatearFechaConMesCapitalizado, capitalizar, eliminarTurno } = usePerfilDashboard(canViewTareas);

    const roles = usePage().props?.auth?.user?.roles || [];
    const contenedorPerfilPermitido = empleado || ['admin', 'encargado', 'operario', 'auxiliar'].some((r) => roles.includes(r));
    const columnasMedias = 'col-span-1 lg:col-span-2';

    return (
        <main>
            <div className="mx-auto max-w-6xl">
                {contenedorPerfilPermitido ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        <div className={columnasMedias}>
                            <TurnosProximos proximos={proximos} cargando={cargando} capitalizar={capitalizar} eliminarTurno={eliminarTurno} />
                        </div>

                        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
                            <div>
                                <Indicadores conteoActivas={conteoActivas} />
                            </div>

                            <div>
                                <TareasCompletadas completadas={completadas} cargando={cargando} formatearFecha={formatearFechaConMesCapitalizado} />
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
