import React from 'react';
import {
    CalendarIcon,
    CreditCardIcon,
    TagIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

export default function CreateReservaTabs({ tabActiva, setTabActiva, errores = {} }) {
    const tieneErrores = (campos) => campos.some((campo) => !!errores[campo]);

    const getTabClass = (id, campos) => {
        const esActiva = tabActiva === id;
        const conError = campos.length > 0 && tieneErrores(campos);
        let base =
            'flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-200 ';

        if (conError) {
            return (
                base +
                (esActiva
                    ? 'text-red-600 border-red-600 bg-red-50'
                    : 'text-red-400 border-transparent hover:text-red-500')
            );
        }
        return (
            base +
            (esActiva
                ? 'text-[#7a0202] border-[#7a0202] bg-red-50/30'
                : 'text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50')
        );
    };

    return (
        <nav className="flex flex-none border-b border-gray-100 bg-white">
            <button
                type="button"
                className={getTabClass('fechas', ['check_in', 'check_out'])}
                onClick={() => setTabActiva('fechas')}
            >
                <CalendarIcon className="h-4 w-4" /> Fechas
            </button>

            <button
                type="button"
                className={getTabClass('cliente', [
                    'nombre_cliente',
                    'email_cliente',
                    'telefono_cliente',
                    'numero_documento',
                ])}
                onClick={() => setTabActiva('cliente')}
            >
                <UserIcon className="h-4 w-4" /> Cliente
            </button>

            <button
                type="button"
                className={getTabClass('tarifas', [])}
                onClick={() => setTabActiva('tarifas')}
            >
                <TagIcon className="h-4 w-4" /> Tarifas
            </button>

            <button
                type="button"
                className={getTabClass('pago', ['metodo_pago', 'num_huespedes'])}
                onClick={() => setTabActiva('pago')}
            >
                <CreditCardIcon className="h-4 w-4" /> Pago
            </button>
        </nav>
    );
}
