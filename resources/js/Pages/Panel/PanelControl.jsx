import CreateCliente from '@/Components/formularios/create/CreateCliente';
import IndexCliente from '@/Components/indexes/IndexCliente';
import CreateCupon from '@/Components/formularios/create/CreateCupon';
import CreateEmpleado from '@/Components/formularios/create/CreateEmpleado';
import IndexEmpleados from '@/Components/indexes/IndexEmpleados';
import CreateHabitacion from '@/Components/formularios/create/CreateHabitacion';
import IndexHabitacion from '@/Components/indexes/IndexHabitacion';
import CreateReserva from '@/Components/reservas/formularios/CreateReserva';
import IndexReserva from '@/Components/indexes/IndexReserva';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BriefcaseIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon,
    InboxIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import React, { Suspense, useEffect, useState } from 'react';
import Tabs from '@/Components/UI/Tabs';

const TABS = [
    { id: 'habitaciones', label: 'Habitaciones', icon: HomeIcon },
    { id: 'clientes', label: 'Clientes', icon: UsersIcon },
    { id: 'empleados', label: 'Empleados', icon: BriefcaseIcon },
    { id: 'reservas', label: 'Reservas', icon: InboxIcon },
    { id: 'configuracion', label: 'Configuración', icon: Cog6ToothIcon },
    { id: 'reembolsos', label: 'Reembolsos', icon: ChartBarIcon },
    { id: 'estadisticas', label: 'Estadísticas', icon: ChartBarIcon },
];

function BotonTab({ id, icon: Icon, label, activa, onClick }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 md:gap-2 md:px-4 md:text-sm ${activa ? 'bg-white text-[#920303] shadow-sm ring-1 ring-black/5' : 'text-[#6b1212] hover:bg-gray-200/50 hover:text-[#920303]'}`}
        >
            <Icon className="h-3 w-3 md:h-4 md:w-4" />{' '}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

import TabConfiguracion from '@/Components/tabs/TabConfiguracion';
import TabReembolsos from '@/Components/tabs/TabReembolsos';
const TabEstadisticas = React.lazy(
    () => import('@/Components/tabs/TabEstadisticas'),
);

// Wrapper simple para añadir padding a los contenidos de las tabs
function TabWrapper({ children }) {
    return <div className="p-3 md:p-6">{children}</div>;
}

function TabContenido({
    tabActiva,
    habitaciones,
    clientes,
    clientesFiltrados,
    users,
    reservas,
    empleados,
    cupones,
    tiposHabitacion,
}) {
    switch (tabActiva) {
        case 'habitaciones':
            return (
                <TabWrapper>
                    <IndexHabitacion habitaciones={habitaciones} />
                </TabWrapper>
            );
        case 'clientes':
            return (
                <TabWrapper>
                    <IndexCliente
                        clientes={clientes}
                        users={users}
                        clientesFiltrados={clientesFiltrados}
                    />
                </TabWrapper>
            );
        case 'reservas':
            return (
                <TabWrapper>
                    <IndexReserva
                        clientes={clientes}
                        users={users}
                        reservas={reservas}
                    />
                </TabWrapper>
            );
        case 'empleados':
            return (
                <TabWrapper>
                    <IndexEmpleados empleados={empleados} />
                </TabWrapper>
            );
        case 'configuracion':
            return (
                <TabConfiguracion
                    cupones={cupones}
                    tiposHabitacion={tiposHabitacion}
                />
            );
        case 'reembolsos':
            return <TabReembolsos />;
        case 'estadisticas':
            return (
                <Suspense
                    fallback={
                        <div className="p-6 text-center">
                            Cargando estadísticas…
                        </div>
                    }
                >
                    <TabEstadisticas />
                </Suspense>
            );
        default:
            return (
                <div className="marcadorLugar">
                    <BriefcaseIcon className="iconoMarcadorLugar" />
                    <p className="textoMarcadorLugar">En desarrollo</p>
                </div>
            );
    }
}
export default function PanelControl({
    habitaciones = [],
    clientes = [],
    clientesFiltrados = [],
    users = [],
    reservas = [],
    empleados = [],
    cupones = {},
    tiposHabitacion = [],
}) {
    const [tabActiva, setTabActiva] = useState('habitaciones');

    // Cargar tab desde localStorage al montar
    useEffect(() => {
        const tabGuardado = localStorage.getItem('panelControlTab');
        if (tabGuardado && TABS.some((t) => t.id === tabGuardado)) {
            setTabActiva(tabGuardado);
        }
    }, []);

    // Guardar tab en localStorage cuando cambia
    const cambiarTab = (tabId) => {
        setTabActiva(tabId);
        localStorage.setItem('panelControlTab', tabId);
    };

    return (
        <AuthenticatedLayout>
            <div className="contenedorPrincipal">
                <div className="contenidoPrincipal">
                    <div className="envoltorioContenido">
                        <div className="sticky top-16 z-30 mb-6 flex w-full justify-center rounded-lg bg-base-200 p-1 shadow-md">
                            <div className="flex flex-wrap justify-center gap-1 md:gap-2">
                                <Tabs tabs={TABS} active={tabActiva} onChange={cambiarTab} variant="panel" />
                            </div>
                        </div>

                        <div className="acciones-rapidas-panel mb-6 flex flex-wrap items-center justify-center gap-3">
                            <CreateReserva iconOnly />
                            <CreateCliente iconOnly />
                            <CreateHabitacion iconOnly />
                            <CreateEmpleado iconOnly />
                            <CreateCupon iconOnly />
                        </div>

                        <div className="contenedorContenido bg-gris">
                            <TabContenido
                                tabActiva={tabActiva}
                                habitaciones={habitaciones}
                                clientes={clientes}
                                clientesFiltrados={clientesFiltrados}
                                users={users}
                                reservas={reservas}
                                empleados={empleados}
                                cupones={cupones}
                                tiposHabitacion={tiposHabitacion}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
