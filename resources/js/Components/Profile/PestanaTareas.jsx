import React from 'react';
import EmpleadoProfile from '@/Components/Profile/EmpleadoProfile';

export default function PestanaTareas({ habitaciones, empleado, auth }) {
    return (
        <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <EmpleadoProfile habitaciones={habitaciones} empleado={empleado} auth={auth} />
                </div>
            </div>
        </div>
    );
}
