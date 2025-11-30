import CreateHabitacion from "@/Components/habitaciones/CreateHabitacion";
import TabHabitaciones from "@/Components/habitaciones/TabHabitaciones";
import TabClientes from "@/Components/TabClientes";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState } from 'react';
import { HomeIcon, UsersIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function PanelControl({ habitaciones = [], clientes = [] }) {
    const [tabActiva, setTabActiva] = useState('habitaciones');

    const tabs = [
        { id: 'habitaciones', icon: HomeIcon, label: 'Habitaciones' },
        { id: 'clientes', icon: UsersIcon, label: 'Clientes' },
        { id: 'empleados', icon: BriefcaseIcon, label: 'Empleados' }
    ];

    const getTabClasses = (id) => `relative flex items-center gap-3 px-8 py-4 font-semibold transition-all duration-300 rounded-t-2xl ${
        tabActiva === id ? 'bg-white text-primary -mb-px z-10 shadow-md' : 'bg-white/50 hover:bg-white/70 hover:shadow-sm'}`;

    return (
        <AuthenticatedLayout>
            <div className="w-full flex flex-col bg-base-200">
                <div className="bg-gris shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4 bg-gris">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-base-content">Panel de Control</h1>
                                <p className="text-sm text-base-content/60 mt-1">Gestión completa de hotel</p>
                            </div>
                            <CreateHabitacion />
                        </div>
                    </div>
                </div>

                <div className="flex-grow">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="flex gap-1 mb-0">
                            {tabs.map(({ id, icon: Icon, label }) => (
                                <button key={id} onClick={() => setTabActiva(id)} className={getTabClasses(id)}>
                                    <Icon className="w-6 h-6 flex-shrink-0" />
                                    {label}
                                    {tabActiva === id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full mx-4 bg-primary"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-xl border-t-4 border-primary/20 overflow-hidden mt-1">
                            {tabActiva === 'habitaciones' && <TabHabitaciones habitaciones={habitaciones} />}
                            {tabActiva === 'clientes' && <TabClientes clientes={clientes} />}
                            {tabActiva === 'empleados' && (
                                <div className="p-6 text-center py-20">
                                    <BriefcaseIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">En desarrollo</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
