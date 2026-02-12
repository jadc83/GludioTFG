import React from 'react';
import IntroResumen from './IntroResumen';
import FichaPersona from './FichaPersona';
import ProfileDashboard from '@/Components/Profile/ProfileDashboard';
import ErrorBoundary from '@/Components/UI/ErrorBoundary';

export default function PestanaInformacion({ empleado, showSummary, habitacionesLimpieza, canViewTareas, auth }) {
    return (
        <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
            <IntroResumen empleado={empleado} showSummary={showSummary} />

            <FichaPersona empleado={empleado} auth={auth} />

            <ErrorBoundary>
                <ProfileDashboard empleado={empleado} habitaciones={habitacionesLimpieza} canViewTareas={canViewTareas} />
            </ErrorBoundary>
        </div>
    );
}
