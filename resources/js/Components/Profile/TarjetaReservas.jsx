import TablaReservas from '@/Components/Profile/TablaReservas';
import React from 'react';

export default function TarjetaReservas({ reservas }) {
    return (
        <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
                {reservas && reservas.length ? (
                    <TablaReservas reservas={reservas} />
                ) : (
                    <div className="p-6 text-sm text-gray-500">No hay reservas para mostrar.</div>
                )}
            </div>
        </div>
    );
}
