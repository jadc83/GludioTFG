import { useState, useEffect } from 'react';
import '../../css/estiloPanelControl.css';
import CreateCliente from '@/Components/clientes/formulario/CreateCliente';
import CreateHabitacion from '@/Components/habitaciones/formulario/CreateHabitacion';
import TabHabitaciones from '@/Components/habitaciones/TabHabitaciones';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {BriefcaseIcon, HomeIcon, UsersIcon} from '@heroicons/react/24/outline';
import TabClientes from '../Components/clientes/TabClientes';
import TabReservas from '../Components/reservas/listado/TabReservas';

const TABS = [
    { id: 'habitaciones', icon: HomeIcon, label: 'Habitaciones' },
    { id: 'clientes', icon: UsersIcon, label: 'Clientes' },
    { id: 'empleados', icon: BriefcaseIcon, label: 'Empleados' },
    { id: 'reservas', icon: BriefcaseIcon, label: 'Reservas' },
];

function BotonTab({ id, icon: Icon, label, activa, onClick }) {
    return (
        <button onClick={() => onClick(id)} className={`flex items-center gap-1 md:gap-2 rounded-md px-2 md:px-4 py-2 text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${activa ? 'bg-white text-[#920303] shadow-sm ring-1 ring-black/5' : 'text-[#6b1212] hover:bg-gray-200/50 hover:text-[#920303]'}`}>
            <Icon className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function TabContenido({ tabActiva, habitaciones, clientes, clientesFiltrados, users, reservas }) {
  switch (tabActiva) {
    case 'habitaciones':
      return <TabHabitaciones habitaciones={habitaciones} />;
    case 'clientes':
      return (
         <TabClientes clientes={clientes} users={users} clientesFiltrados={clientesFiltrados}/>
      );
    case 'reservas':
      return (
        <TabReservas clientes={clientes} users={users} reservas={reservas}/>
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
export default function PanelControl({ habitaciones = [], clientes = [], clientesFiltrados = [], users = [], reservas = []}) {
    const [tabActiva, setTabActiva] = useState('habitaciones');

    // Cargar tab desde localStorage al montar
    useEffect(() => {
        const tabGuardado = localStorage.getItem('panelControlTab');
        if (tabGuardado && TABS.some(t => t.id === tabGuardado)) {
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
                                    <CreateCliente iconOnly />
                                    <CreateHabitacion iconOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="contenidoPrincipal">
                    <div className="envoltorioContenido">
                        <div className="mb-6 flex w-full justify-center rounded-lg bg-base-200 p-1">
                            <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
                                {TABS.map((tab) => (
                                    <BotonTab key={tab.id} id={tab.id} icon={tab.icon} label={tab.label} activa={tabActiva === tab.id} onClick={cambiarTab}/>
                                ))}
                            </div>
                        </div>

                        <div className="contenedorContenido bg-gris">
                            <TabContenido tabActiva={tabActiva} habitaciones={habitaciones} clientes={clientes} clientesFiltrados={clientesFiltrados}
                                users={users} reservas={reservas}/>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
