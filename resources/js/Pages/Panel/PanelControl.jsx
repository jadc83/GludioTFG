import CreateCliente from '@/Components/clientes/formulario/CreateCliente';
import IndexCliente from '@/Components/clientes/IndexCliente';
import CreateCupon from '@/Components/cupones/formulario/CreateCupon';
import CreateEmpleado from '@/Components/empleados/formulario/CreateEmpleado';
import IndexEmpleados from '@/Components/empleados/IndexEmpleados';
import CreateHabitacion from '@/Components/habitaciones/formulario/CreateHabitacion';
import IndexHabitacion from '@/Components/habitaciones/IndexHabitacion';
import IndexReserva from '@/Components/reservas/listado/IndexReserva';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BriefcaseIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import React, { Suspense, useEffect, useState } from 'react';
import '../../../css/estiloPanelControl.css';

const TABS = [
    { id: 'habitaciones', icon: HomeIcon, label: 'Habitaciones' },
    { id: 'clientes', icon: UsersIcon, label: 'Clientes' },
    { id: 'empleados', icon: BriefcaseIcon, label: 'Empleados' },
    { id: 'reservas', icon: BriefcaseIcon, label: 'Reservas' },
    { id: 'configuracion', icon: Cog6ToothIcon, label: 'Configuración' },
    { id: 'reembolsos', icon: BriefcaseIcon, label: 'Reembolsos' },
    { id: 'estadisticas', icon: ChartBarIcon, label: 'Estadísticas' },
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

import TabConfiguracion from '@/Pages/Panel/TabConfiguracion';
import TabReembolsos from '@/Pages/Panel/TabReembolsos';
const TabEstadisticas = React.lazy(
    () => import('@/Pages/Panel/TabEstadisticas'),
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
                <div className="seccionEncabezado">
                    <div className="contenidoEncabezado">
                        <div className="flexEncabezado">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="tituloEncabezado">
                                        Panel de Control
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={route('scan-qr')}
                                        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                        Escáner QR
                                    </Link>
                                    <CreateCliente iconOnly />
                                    <CreateHabitacion iconOnly />
                                    <CreateEmpleado iconOnly />
                                    <CreateCupon iconOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="contenidoPrincipal">
                    <div className="envoltorioContenido">
                        <div className="mb-6 flex w-full justify-center rounded-lg bg-base-200 p-1">
                            <div className="flex flex-wrap justify-center gap-1 md:gap-2">
                                {TABS.map((tab) => (
                                    <BotonTab
                                        key={tab.id}
                                        id={tab.id}
                                        icon={tab.icon}
                                        label={tab.label}
                                        activa={tabActiva === tab.id}
                                        onClick={cambiarTab}
                                    />
                                ))}
                            </div>
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
