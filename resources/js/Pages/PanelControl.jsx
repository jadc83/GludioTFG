import CreateHabitacion from "@/Components/habitaciones/CreateHabitacion";
import TabHabitaciones from "@/Components/habitaciones/TabHabitaciones";
import TabClientes from "../Components/clientes/TabClientes";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState } from 'react';
import { HomeIcon, UsersIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import '../../css/estiloPanelControl.css';

export default function PanelControl({ habitaciones = [], clientes = [], users = [] }) {
    const [tabActiva, setTabActiva] = useState('habitaciones');

    const tabs = [
        { id: 'habitaciones', icon: HomeIcon, label: 'Habitaciones' },
        { id: 'clientes', icon: UsersIcon, label: 'Clientes' },
        { id: 'empleados', icon: BriefcaseIcon, label: 'Empleados' }
    ];

    const getClasesPestaña = (id) => `btnPestaña ${tabActiva === id ? 'activa' : ''}`;

    return (
        <AuthenticatedLayout>
            <div className="contenedorPrincipal">
                <div className="seccionEncabezado">
                    <div className="contenidoEncabezado">
                        <div className="flexEncabezado">
                            <div>
                                <h1 className="tituloEncabezado">Panel de Control</h1>
                                <p className="subtituloEncabezado">Gestión completa de hotel</p>
                            </div>
                            <CreateHabitacion />
                        </div>
                    </div>
                </div>

                <div className="contenidoPrincipal">
                    <div className="envoltorioContenido">
                        <div className="contenedorPestañas">
                            {tabs.map(({ id, icon: Icon, label }) => (
                                <button key={id} onClick={() => setTabActiva(id)} className={getClasesPestaña(id)}>
                                    <Icon className="iconoPestaña" />
                                    {label}
                                    {tabActiva === id && <div className="indicadorActivo"></div>}
                                </button>
                            ))}
                        </div>

                        <div className="contenedorContenido">
                            {tabActiva === 'habitaciones' && <TabHabitaciones habitaciones={habitaciones} />}
                            {tabActiva === 'clientes' && <TabClientes clientes={clientes} users={users} />}
                            {tabActiva === 'empleados' && (
                                <div className="marcadorLugar">
                                    <BriefcaseIcon className="iconoMarcadorLugar" />
                                    <p className="textoMarcadorLugar">En desarrollo</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
