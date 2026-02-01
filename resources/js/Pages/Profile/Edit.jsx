import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import {
    CalendarIcon,
    UserIcon,
    LockClosedIcon,
    ChevronRightIcon,
    IdentificationIcon,
    TicketIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Edit({ mustVerifyEmail, status, auth, reservas = [] }) {
    const [activeTab, setActiveTab] = useState('informacion');

    const tabs = [
        { id: 'informacion', label: 'Mi Perfil', icon: UserIcon },
        { id: 'reservas', label: 'Mis Reservas', icon: CalendarIcon },
        { id: 'seguridad', label: 'Seguridad', icon: LockClosedIcon },
    ];

    // Configuración de estados para la tabla de reservas
    const configEstado = {
        'Completada': 'bg-blue-50 text-blue-700 border-blue-100',
        'Confirmada': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'En curso': 'bg-amber-50 text-amber-700 border-amber-100',
        'Cancelada': 'bg-rose-50 text-rose-700 border-rose-100',
        'default': 'bg-gray-50 text-gray-500 border-gray-100'
    };

    return (
        <AuthenticatedLayout>
            <Head title="Mi Perfil" />

            <div className="py-12 bg-gray-50 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* --- ENCABEZADO DE SECCIÓN --- */}
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
                                Centro de <span className="text-[#7a0202]">Usuario</span>
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
                                Gestiona tu cuenta, historial de estancias y seguridad
                            </p>
                        </div>
                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center border border-gray-200 shadow-sm">
                            <IdentificationIcon className="h-7 w-7 text-gray-400" />
                        </div>
                    </div>

                    {/* --- NAVEGACIÓN POR TABS (ESTILO INDUSTRIAL) --- */}
                    <div className="flex gap-2 mb-8 bg-gray-200/50 p-1.5 rounded-2xl w-fit">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        isActive
                                        ? 'bg-[#7a0202] text-white shadow-lg shadow-red-900/20'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* --- CONTENEDOR PRINCIPAL DE CONTENIDO --- */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">

                        {/* TAB: INFORMACIÓN PERSONAL */}
                        {activeTab === 'informacion' && (
                            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] mb-1">Información Personal</h3>
                                    <p className="text-xs text-gray-400 font-medium">Actualiza los datos de tu ficha de cliente</p>
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
                            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] mb-1">Historial de Estancias</h3>
                                    <p className="text-xs text-gray-400 font-medium">Consulta el estado de tus reservas actuales y pasadas</p>
                                </div>

                                {reservas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <TicketIcon className="h-8 w-8 text-gray-200" />
                                        </div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">No hay registros</h4>
                                        <p className="text-xs text-gray-400 mt-1 mb-8">Parece que aún no has realizado ninguna reserva con nosotros.</p>
                                        <Link href="/" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition shadow-lg shadow-gray-200">
                                            Explorar Habitaciones
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Localizador</th>
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Check-In / Out</th>
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Noches</th>
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inversión</th>
                                                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado</th>
                                                    <th className="pb-5"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {reservas.map((reserva) => (
                                                    <tr key={reserva.id} className="group hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-6">
                                                            <div className="h-9 w-20 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-gray-200 group-hover:bg-[#7a0202] transition-colors">
                                                                <span className="font-mono text-xs font-black tracking-tighter">{reserva.localizador}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6">
                                                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-600">
                                                                <span>{reserva.fecha_entrada}</span>
                                                                <span className="text-gray-300">→</span>
                                                                <span>{reserva.fecha_salida}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 text-center text-xs font-black text-gray-900">
                                                            {reserva.noches}
                                                        </td>
                                                        <td className="py-6 font-black text-gray-900 text-sm italic">
                                                            {reserva.monto_total}
                                                        </td>
                                                        <td className="py-6">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${configEstado[reserva.estado] || configEstado.default}`}>
                                                                {reserva.estado}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 text-right">
                                                            <Link
                                                                href={`/reservas/${reserva.id}`}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-400 hover:text-[#7a0202] rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
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
                            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10 text-center md:text-left">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] mb-1">Protección de Cuenta</h3>
                                    <p className="text-xs text-gray-400 font-medium">Asegura tu cuenta actualizando la contraseña periódicamente</p>
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
