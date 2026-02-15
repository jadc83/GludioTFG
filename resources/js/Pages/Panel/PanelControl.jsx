import CreateCliente from '@/Components/formularios/create/CreateCliente';
import CreateCupon from '@/Components/formularios/create/CreateCupon';
import CreateEmpleado from '@/Components/formularios/create/CreateEmpleado';
import CreateHabitacion from '@/Components/formularios/create/CreateHabitacion';
import IndexCliente from '@/Components/indexes/IndexCliente';
import IndexDepartamentos from '@/Components/indexes/IndexDepartamentos';
import IndexEmpleados from '@/Components/indexes/IndexEmpleados';
import IndexHabitacion from '@/Components/indexes/IndexHabitacion';
import IndexReserva from '@/Components/indexes/IndexReserva';
import CreateReserva from '@/Components/reservas/formularios/CreateReserva';
import Tabs from '@/Components/UI/Tabs';
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
import { usePage } from '@inertiajs/react';

// Base tabs; `configuracion` y `estadisticas` se añaden dinámicamente según permisos
const BASE_TABS = [
    { id: 'reservas', label: 'Reservas y reembolsos', icon: InboxIcon },
    { id: 'clientes', label: 'Clientes', icon: UsersIcon },
    { id: 'habitaciones', label: 'Habitaciones', icon: HomeIcon },
    { id: 'departamentos', label: 'Departamentos', icon: ChartBarIcon },
];

// `BotonTab` was removed because it was defined but not used.

import TabConfiguracion from '@/Components/tabs/TabConfiguracion';

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
        case 'departamentos':
            return (
                <TabWrapper>
                    <IndexDepartamentos empleados={empleados} />
                </TabWrapper>
            );
        case 'configuracion':
            return (
                <TabConfiguracion
                    cupones={cupones}
                    tiposHabitacion={tiposHabitacion}
                />
            );
        case 'estadisticas':
            return (
                <Suspense
                    fallback={
                        <div className="p-6 text-center">
                            Cargando estadísticas…
                        </div>
                    }
                >
                    <TabEstadisticas reservas={reservas} />
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
    const { props } = usePage();
    const roles = props?.auth?.user?.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes('admin');
    const isEncargadoRole = Array.isArray(roles) && roles.includes('encargado');
    const empleadoDept = (props?.auth?.user?.empleado_departamento || '').toLowerCase();
    const perteneceLimpiezaOMantenimiento = ['limpieza', 'mantenimiento'].includes(empleadoDept);
    const pestañasProhibidasParaLimpieza = ['reservas', 'clientes'];
    const visibleBaseTabs = perteneceLimpiezaOMantenimiento
        ? BASE_TABS.filter((t) => !pestañasProhibidasParaLimpieza.includes(t.id))
        : BASE_TABS;
    // Encargados no pertenecientes a limpieza ni mantenimiento
    const isEncargado = isEncargadoRole && !['limpieza', 'mantenimiento'].includes(empleadoDept);

    const [tabActiva, setTabActiva] = useState(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const fromUrl = params.get('tab');
            if (fromUrl) return fromUrl;
            const stored = localStorage.getItem('panelControlTab');
            return stored || 'reservas';
        } catch (e) {
            return 'reservas';
        }
    });

    // Si el usuario pertenece a limpieza/mantenimiento y la pestaña activa está prohibida,
    // cambiar a la primera pestaña visible para evitar mostrar contenido no permitido.
    React.useEffect(() => {
        if (!perteneceLimpiezaOMantenimiento) return;
        if (pestañasProhibidasParaLimpieza.includes(tabActiva)) {
            const nueva = (visibleBaseTabs[0] && visibleBaseTabs[0].id) || 'departamentos';
            setTabActiva(nueva);
            try {
                localStorage.setItem('panelControlTab', nueva);
            } catch (e) {}
        }
    }, [perteneceLimpiezaOMantenimiento, tabActiva, visibleBaseTabs]);

    // Guardar tab en localStorage cuando cambia
    const cambiarTab = (tabId) => {
        setTabActiva(tabId);
        try {
            localStorage.setItem('panelControlTab', tabId);
        } catch (e) {
            // silenciar errores en entornos sin localStorage
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="contenedorPrincipal">
                <div className="contenidoPrincipal">
                    <div className="envoltorioContenido">
                        <div className="sticky top-16 z-30 mb-6 flex w-full justify-center rounded-lg bg-base-200 p-1 shadow-md text-[10px] md:text-[11px] lg:text-[12px] leading-tight">
                            <div className="flex w-full items-center gap-1 md:gap-2">
                                    <Tabs
                                        tabs={
                                                isAdmin
                                                    ? [...visibleBaseTabs, { id: 'configuracion', label: 'Configuración', icon: Cog6ToothIcon }, ...(isAdmin || isEncargado ? [{ id: 'estadisticas', label: 'Estadísticas', icon: ChartBarIcon }] : [])]
                                                                    : [...visibleBaseTabs, ...(isAdmin || isEncargado ? [{ id: 'estadisticas', label: 'Estadísticas', icon: ChartBarIcon }] : [])]
                                        }
                                        active={tabActiva}
                                        onChange={cambiarTab}
                                        variant="panel"
                                    />
                            </div>
                        </div>

                        {!perteneceLimpiezaOMantenimiento && (
                            <div className="acciones-rapidas-panel mb-6 flex flex-wrap items-center justify-center gap-1 text-[10px] leading-tight">
                                <CreateReserva iconOnly />
                                <CreateCliente iconOnly />
                                <CreateHabitacion iconOnly />
                                <CreateEmpleado iconOnly />
                                <CreateCupon iconOnly />
                            </div>
                        )}

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
