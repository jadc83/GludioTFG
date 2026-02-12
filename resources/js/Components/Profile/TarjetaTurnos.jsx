import TurnosCalendar from '@/Components/Profile/TurnosCalendar';
import React from 'react';

export default function TarjetaTurnos() {
    return (
        <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
                <TurnosCalendar />
            </div>
        </div>
    );
}
