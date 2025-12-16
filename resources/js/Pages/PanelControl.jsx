import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateHabitacion from "@/Components/habitaciones/formulario/CreateHabitacion";
import CreateCliente from "@/Components/clientes/formulario/CreateCliente";
import TabHabitaciones from "@/Components/habitaciones/TabHabitaciones";
import TabClientes from "../Components/clientes/TabClientes";
import { HomeIcon, UsersIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import '../../css/estiloPanelControl.css';
import TabReservas from '../Components/reservas/TabReservas';

const TABS = [
    { id: 'habitaciones', icon: HomeIcon, label: 'Habitaciones' },
    { id: 'clientes', icon: UsersIcon, label: 'Clientes' },
    { id: 'empleados', icon: BriefcaseIcon, label: 'Empleados' },
    { id: 'reservas', icon: BriefcaseIcon, label: 'Reservas' },
];

function BotonTab({ id, icon: Icon, label, activa, onClick }) {
    return (
        <button onClick={() => onClick(id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activa ? 'bg-white text-[#920303] shadow-sm ring-1 ring-black/5' : 'text-[#6b1212] hover:text-[#920303] hover:bg-gray-200/50'}`}>
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

function TabContenido({ tabActiva, habitaciones, clientes, clientesFiltrados, users, reservas }) {
    if (tabActiva === 'habitaciones') {
        return <TabHabitaciones habitaciones={habitaciones} />;
    }

    if (tabActiva === 'clientes') {
        return <TabClientes clientes={clientes} users={users} clientesFiltrados={clientesFiltrados} />;
    }

    if (tabActiva === 'reservas') {
        return <TabReservas clientes={clientes} users={users} reservas={reservas} />;
    }

    return (
        <div className="marcadorLugar">
            <BriefcaseIcon className="iconoMarcadorLugar" />
            <p className="textoMarcadorLugar">En desarrollo</p>
        </div>
    );
}

export default function PanelControl({ habitaciones = [], clientes = [], clientesFiltrados = [], users = [], reservas = []}) {

    const [tabActiva, setTabActiva] = useState('habitaciones');

    return (
        <AuthenticatedLayout>
            <div className="contenedorPrincipal">
                <div className="seccionEncabezado">
                    <div className="contenidoEncabezado">
                        <div className="flexEncabezado">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="tituloEncabezado">Panel de Control</h1>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CreateCliente iconOnly />
                                    <CreateHabitacion iconOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="contenidoPrincipal">
                    <div className="envoltorioContenido">
                        <div className="bg-base-200 p-1 rounded-lg flex justify-center w-full mb-6">
                            <div className="inline-flex gap-2">
                                {TABS.map(tab => (
                                    <BotonTab key={tab.id} id={tab.id} icon={tab.icon} label={tab.label} activa={tabActiva === tab.id} onClick={setTabActiva} />
                                ))}
                            </div>
                        </div>

                        <div className="contenedorContenido bg-gris">
                            <TabContenido tabActiva={tabActiva} habitaciones={habitaciones} clientes={clientes} clientesFiltrados={clientesFiltrados} users={users}
                                reservas={reservas}/>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
