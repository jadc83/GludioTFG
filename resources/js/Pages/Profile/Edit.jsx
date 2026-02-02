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
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import '../../../css/profile.css';

export default function Edit({ mustVerifyEmail, status, auth, reservas = [] }) {
    const [activeTab, setActiveTab] = useState('informacion');

    const tabs = [
        { id: 'informacion', label: 'Mi Perfil', icon: UserIcon },
        { id: 'reservas', label: 'Mis Reservas', icon: CalendarIcon },
        { id: 'seguridad', label: 'Seguridad', icon: LockClosedIcon },
    ];

    // Configuración de estados para la tabla de reservas
    const configEstado = {
        Completada: 'bg-blue-50 text-blue-700 border-blue-100',
        Confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'En curso': 'bg-amber-50 text-amber-700 border-amber-100',
        Cancelada: 'bg-rose-50 text-rose-700 border-rose-100',
        default: 'bg-gray-50 text-gray-500 border-gray-100',
    };

    return (
        <AuthenticatedLayout>
            <Head title="Mi Perfil" />

            <div className="perfil-page">
                <div className="mx-auto max-w-6xl">
                    {/* --- ENCABEZADO DE SECCIÓN --- */}
                    <div className="perfil-header mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black uppercase leading-none tracking-tight text-gray-900 sm:text-3xl">
                                Centro de{' '}
                                <span className="text-gray-900">Usuario</span>
                            </h1>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Gestiona tu cuenta, historial de estancias y
                                seguridad
                            </p>
                        </div>
                        <div className="icono flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm sm:h-14 sm:w-14">
                            <IdentificationIcon className="h-7 w-7 text-gray-400" />
                        </div>
                    </div>

                    {/* --- NAVEGACIÓN POR TABS (MOBILE FIRST) --- */}
                    <div className="perfil-tabs mb-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        isActive
                                            ? 'active'
                                            : ''
                                    }`}
                                >
                                    <Icon
                                        className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`}
                                    />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* --- CONTENEDOR PRINCIPAL DE CONTENIDO --- */}
                    <div className="perfil-card min-h-[500px] overflow-hidden">
                        {/* TAB: INFORMACIÓN PERSONAL */}
                        {activeTab === 'informacion' && (
                            <div className="perfil-body animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10">
                                    <h3 className="mb-1 text-xs font-black uppercase tracking-[0.3em] text-gray-900">
                                        Información Personal
                                    </h3>
                                    <p className="text-xs font-medium text-gray-400">
                                        Actualiza los datos de tu ficha de
                                        cliente
                                    </p>
                                </div>
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
                                <div className="mb-10">
                                    <h3 className="mb-1 text-xs font-black uppercase tracking-[0.3em] text-gray-900">
                                        Historial de Estancias
                                    </h3>
                                    <p className="text-xs font-medium text-gray-400">
                                        Consulta el estado de tus reservas
                                        actuales y pasadas
                                    </p>
                                </div>

                                {reservas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                                            <TicketIcon className="h-8 w-8 text-gray-200" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">
                                            No hay registros
                                        </h4>
                                        <p className="mb-8 mt-1 text-xs text-gray-400">
                                            Parece que aún no has realizado
                                            ninguna reserva con nosotros.
                                        </p>
                                        <Link
                                            href="/"
                                            className="rounded-2xl bg-gray-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-gray-200 transition hover:bg-black"
                                        >
                                            Explorar Habitaciones
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left responsive-table">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                        Localizador
                                                    </th>
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                        Check-In / Out
                                                    </th>
                                                    <th className="pb-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                        Noches
                                                    </th>
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                        Inversión
                                                    </th>
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                        Estado
                                                    </th>
                                                    <th className="pb-5"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {reservas.map((reserva) => (
                                                    <tr
                                                        key={reserva.id}
                                                        className="group transition-colors hover:bg-gray-50/50"
                                                    >
                                                        <td className="py-6" data-label="Localizador">
                                                            <div className="flex h-9 w-20 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200 transition-colors group-hover:bg-[#7a0202]">
                                                                <span className="font-mono text-xs font-black tracking-tighter">
                                                                    {
                                                                        reserva.localizador
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6" data-label="Check-In / Out">
                                                            <div className="flex items-center gap-2 font-mono text-xs font-bold text-gray-600">
                                                                <span>
                                                                    {
                                                                        reserva.fecha_entrada
                                                                    }
                                                                </span>
                                                                <span className="text-gray-300">
                                                                    →
                                                                </span>
                                                                <span>
                                                                    {
                                                                        reserva.fecha_salida
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 text-center text-xs font-black text-gray-900" data-label="Noches">
                                                            {reserva.noches}
                                                        </td>
                                                        <td className="py-6 text-sm font-black italic text-gray-900" data-label="Inversión">
                                                            {
                                                                reserva.monto_total
                                                            }
                                                        </td>
                                                        <td className="py-6" data-label="Estado">
                                                            <span
                                                                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${configEstado[reserva.estado] || configEstado.default}`}
                                                            >
                                                                {reserva.estado}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 text-right" data-label="">
                                                            <Link
                                                                href={`/reservas/${reserva.id}`}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:text-[#7a0202]"
                                                            >
                                                                Detalles
                                                                <ChevronRightIcon className="h-3 w-3" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: SEGURIDAD */}
                        {activeTab === 'seguridad' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 p-8 duration-500 md:p-12">
                                <div className="mb-10 text-center md:text-left">
                                    <h3 className="mb-1 text-xs font-black uppercase tracking-[0.3em] text-gray-900">
                                        Protección de Cuenta
                                    </h3>
                                    <p className="text-xs font-medium text-gray-400">
                                        Asegura tu cuenta actualizando la
                                        contraseña periódicamente
                                    </p>
                                </div>
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
