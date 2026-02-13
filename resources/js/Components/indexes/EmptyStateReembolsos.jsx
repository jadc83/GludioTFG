import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

export default function EmptyStateReembolsos() {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-8">
                <InboxIcon className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Sin solicitudes activas</h3>
            <p className="mt-2 max-w-xs text-sm text-gray-400">No hay reembolsos pendientes de procesar en este momento.</p>
        </div>
    );
}
