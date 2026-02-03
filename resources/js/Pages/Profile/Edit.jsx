import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    CalendarIcon,
    ChevronRightIcon,
    IdentificationIcon,
    LockClosedIcon,
    TicketIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import '../../../css/profile.css';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import ReservationsTable from '@/Components/Profile/ReservationsTable';
import Tabs from '@/Components/UI/Tabs';

export default function Edit({ mustVerifyEmail, status, auth, reservas = [] }) {
    const [activeTab, setActiveTab] = useState('informacion');

    const tabs = [
        { id: 'informacion', label: 'Mi Perfil', icon: UserIcon },
        { id: 'reservas', label: 'Mis Reservas', icon: CalendarIcon },
        { id: 'seguridad', label: 'Seguridad', icon: LockClosedIcon },
    ];

    // Configuración de estados para la tabla de reservas
    const configEstado = {
        Completada: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'En curso': 'bg-amber-50 text-amber-700 border-amber-100',
        Cancelada: 'bg-rose-50 text-rose-700 border-rose-100',
        'Reembolsado': 'bg-sky-50 text-sky-700 border-sky-100',
        default: 'bg-gray-50 text-gray-500 border-gray-100',
    };

    return (
        <AuthenticatedLayout>
            <Head title="Mi Perfil" />

            <div className="perfil-page">
                <div className="mx-auto max-w-6xl">
                    {/* --- ENCABEZADO DE SECCIÓN --- */}
                    <HeaderPanel
                        titulo="Usuario"
                        subtitulo="Gestiona tu cuenta, historial de estancias y seguridad"
                        icono={IdentificationIcon}
                    />

                    {/* --- NAVEGACIÓN POR TABS (MOBILE FIRST) --- */}
                    <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="profile" />

                    {/* --- CONTENEDOR PRINCIPAL DE CONTENIDO --- */}
                    <div className="perfil-card min-h-[500px] overflow-hidden">
                        {/* TAB: INFORMACIÓN PERSONAL */}
                        {activeTab === 'informacion' && (
                            <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className="max-w-none"
                                />
                            </div>
                        )}

                        {/* TAB: MIS RESERVAS */}
                        {activeTab === 'reservas' && (
                            <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {reservas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                                            <TicketIcon className="h-8 w-8 text-gray-200" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">
                                            No hay registros
                                        </h4>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <ReservationsTable reservas={reservas} configEstado={configEstado} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: SEGURIDAD */}
                        {activeTab === 'seguridad' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 p-8 duration-500 md:p-12">
                                <div className="max-w-2xl">
                                    <UpdatePasswordForm className="w-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
