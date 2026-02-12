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
import TarjetaEncargado from '@/Components/Profile/TarjetaEncargado';
import SeccionSeguridad from './SeccionSeguridad';
import TarjetaReservas from '@/Components/Profile/TarjetaReservas';
import TarjetaTurnos from '@/Components/Profile/TarjetaTurnos';
import PestanaInformacion from '@/Components/Profile/PestanaInformacion';
import PestanaTareas from '@/Components/Profile/PestanaTareas';

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
            ? [{ id: 'informacion', label: 'Resumen', icon: UserIcon }]
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
        { id: 'seguridad', label: 'Información de cuenta', icon: LockClosedIcon },

    ];

    // Inicializar tab según query param ?tab=... o por defecto al primer tab disponible
    const tabInicial = (() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('tab');
        } catch (e) {
            return null;
        }
    })();

    const [activeTab, setActiveTab] = useState(() => {
        if (tabInicial && tabs.some((t) => t.id === tabInicial))
            return tabInicial;
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
                    {/* Encargado principal: fuera de la info, visible bajo el header */}
                    <TarjetaEncargado encargado={empleado?.departamento_encargado} />


                    {/* --- NAVEGACIÓN POR TABS (MOBILE FIRST) --- */}
                    <Tabs
                        tabs={tabs}
                        active={activeTab}
                        onChange={setActiveTab}
                        variant="profile"
                    />

                    {/* --- CONTENEDOR PRINCIPAL DE CONTENIDO --- */}
                    <div className="min-h-[500px] overflow-hidden">
                        {/* TAB: INFORMACIÓN PERSONAL */}
                        {activeTab === 'informacion' && (
                            <PestanaInformacion
                                empleado={empleado}
                                showSummary={showSummary}
                                habitacionesLimpieza={habitacionesLimpieza}
                                canViewTareas={can_view_tareas}
                                auth={auth}
                            />
                        )}

                        {/* TAB: TAREAS */}
                        {activeTab === 'tareas' && <PestanaTareas habitaciones={habitacionesLimpieza} />}

                        {/* TAB: RESERVAS */}
                        {activeTab === 'reservas' && <TarjetaReservas reservas={reservas} />}

                        {/* TAB: TURNOS */}
                        {activeTab === 'turnos' && <TarjetaTurnos />}

                        {/* TAB: SEGURIDAD */}
                        {activeTab === 'seguridad' && (
                            <SeccionSeguridad mustVerifyEmail={mustVerifyEmail} status={status} />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
