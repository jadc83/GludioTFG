import ReservationsTable from '@/Components/Profile/ReservationsTable';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Tabs from '@/Components/UI/Tabs';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BriefcaseIcon,
    CalendarIcon,
    IdentificationIcon,
    LockClosedIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import '../../../css/profile.css';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

import EmpleadoProfile from '@/Components/Profile/EmpleadoProfile';
import ProfileDashboard from '@/Components/Profile/ProfileDashboard';
import TareasList from '@/Components/Profile/TareasList';
import TurnosCalendar from '@/Components/Profile/TurnosCalendar';
import ErrorBoundary from '@/Components/UI/ErrorBoundary';

export default function Edit({
    mustVerifyEmail,
    status,
    auth,
    reservas = [],
    empleado = null,
    habitacionesLimpieza = [],
    can_view_reservas = false,
    can_view_tareas = false,
    show_profile_tab = false,
}) {
    // Construir tabs dinámicamente según permisos (Spatie)
    const tabs = [
        ...(show_profile_tab
            ? [{ id: 'informacion', label: 'Mi Perfil', icon: UserIcon }]
            : []),
        ...(can_view_reservas
            ? [{ id: 'reservas', label: 'Mis Reservas', icon: CalendarIcon }]
            : []),
        ...(can_view_tareas
            ? [
                  { id: 'tareas', label: 'Tareas', icon: BriefcaseIcon },
                  { id: 'turnos', label: 'Turnos', icon: CalendarIcon },
              ]
            : []),
        { id: 'seguridad', label: 'Seguridad', icon: LockClosedIcon },
    ];

    // Inicializar tab según query param ?tab=... o por defecto al primer tab disponible
    const initialTabFromUrl = (() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('tab');
        } catch (e) {
            return null;
        }
    })();

    const [activeTab, setActiveTab] = useState(() => {
        if (initialTabFromUrl && tabs.some((t) => t.id === initialTabFromUrl))
            return initialTabFromUrl;
        return tabs[0]?.id || 'seguridad';
    });

    // Nota: `configEstado` eliminado — estaba declarado pero no usado.

    // Mostrar resumen solo si es empleado o tiene rol admin/encargado/operario/auxiliar
    const roles = auth?.user?.roles || [];
    const showSummary =
        empleado ||
        roles.some((r) =>
            ['admin', 'encargado', 'operario', 'auxiliar'].includes(r),
        );

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
                    <Tabs
                        tabs={tabs}
                        active={activeTab}
                        onChange={setActiveTab}
                        variant="profile"
                    />

                    {/* --- CONTENEDOR PRINCIPAL DE CONTENIDO --- */}
                    <div className="perfil-card min-h-[500px] overflow-hidden">
                        {/* TAB: INFORMACIÓN PERSONAL */}
                        {activeTab === 'informacion' && (
                            <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {showSummary ? (
                                    <div className="mb-6">
                                        <h2 className="text-lg font-extrabold">
                                            Panel de control
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Resumen rápido: información
                                            personal, próximos turnos y últimas
                                            tareas completadas.
                                        </p>
                                    </div>
                                ) : null}

                                <ErrorBoundary>
                                    <ProfileDashboard
                                        empleado={empleado}
                                        habitaciones={habitacionesLimpieza}
                                        canViewTareas={can_view_tareas}
                                    />
                                </ErrorBoundary>

                                <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Editar información
                                    </h3>
                                    <div className="mt-3">
                                        <UpdateProfileInformationForm
                                            mustVerifyEmail={mustVerifyEmail}
                                            status={status}
                                            className="max-w-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: TAREAS */}
                        {activeTab === 'tareas' && (
                            <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="col-span-1">
                                        <div className="rounded-xl border border-gray-100 bg-white p-4">
                                            <div className="mt-3">
                                                <TareasList />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-6">
                                        <EmpleadoProfile
                                            habitaciones={habitacionesLimpieza}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB: RESERVAS */}
                        {activeTab === 'reservas' && (
                            <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="rounded-xl border border-gray-100 bg-white p-4">
                                    {reservas && reservas.length ? (
                                        <ReservationsTable
                                            reservas={reservas}
                                        />
                                    ) : (
                                        <div className="p-6 text-sm text-gray-500">
                                            No hay reservas para mostrar.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* TAB: TURNOS */}
                        {activeTab === 'turnos' && (
                            <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="rounded-xl border border-gray-100 bg-white p-4">
                                    <TurnosCalendar />
                                </div>
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
