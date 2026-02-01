import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GestionTiposHabitacion from '@/Components/Admin/GestionTiposHabitacion';
import BotonVolver from '@/Components/UI/BotonVolver';

export default function GestionTipos() {
    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Tipos de Habitación" />

            <div className="py-12">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <BotonVolver />
                    </div>
                    <GestionTiposHabitacion />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
