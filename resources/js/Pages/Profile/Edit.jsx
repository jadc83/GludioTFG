import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Badge from '@/Components/UI/Badge';
import BotonVolver from '@/Components/UI/BotonVolver';
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



    return (
        <AuthenticatedLayout>
            <Head title="Mi Perfil" />

            <div className="py-12 min-h-screen" style={{ backgroundImage: "url('/fondo2.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* --- ENCABEZADO DE SECCIÓN --- */}
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                                Centro de <span className="text-white/80">Usuario</span>
                            </h1>
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mt-2">
                                Gestiona tu cuenta, historial de estancias y seguridad
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <BotonVolver href={route('home')} />
                            <div className="h-14 w-14 bg-black/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-sm">
                                <IdentificationIcon className="h-7 w-7 text-white/60" />
                            </div>
                        </div>
                    </div>

                    {/* --- NAVEGACIÓN POR TABS (ESTILO INDUSTRIAL) --- */}
                    <div className="flex gap-2 mb-8 bg-gray-900 p-1.5 rounded-2xl w-fit border border-white/10">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        isActive
                                        ? 'bg-black/30 text-white border border-white/40'
                                        : 'text-white/60 hover:text-white hover:bg-black/20'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/40'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* --- CONTENEDOR PRINCIPAL DE CONTENIDO --- */}
                    <div className="bg-gray-900 rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden min-h-[500px]">

                        {/* TAB: INFORMACIÓN PERSONAL */}
                        {activeTab === 'informacion' && (
                            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10">
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-1">Información Personal</h3>
                                    <p className="text-xs text-white/60 font-medium">Actualiza los datos de tu ficha de cliente</p>
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
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-1">Historial de Estancias</h3>
                                    <p className="text-xs text-white/60 font-medium">Consulta el estado de tus reservas actuales y pasadas</p>
                                </div>

                                {reservas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="h-16 w-16 bg-black/20 rounded-full flex items-center justify-center mb-4 border border-white/20">
                                            <TicketIcon className="h-8 w-8 text-white/40" />
                                        </div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">No hay registros</h4>
                                        <p className="text-xs text-white/60 mt-1 mb-8">Parece que aún no has realizado ninguna reserva con nosotros.</p>
                                        <Link href="/" className="px-8 py-4 bg-black/30 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black/50 transition shadow-lg border border-white/20">
                                            Explorar Habitaciones
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/20 bg-gray-900">
                                                    <th className="py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-tl-2xl">Localizador</th>
                                                    <th className="py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white">Check-In / Out</th>
                                                    <th className="py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white">Noches</th>
                                                    <th className="py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white">Inversión</th>
                                                    <th className="py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white">Estado</th>
                                                    <th className="py-5 text-center rounded-tr-2xl"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {reservas.map((reserva) => (
                                                    <tr key={reserva.id} className="group bg-gris hover:bg-gray-200 transition-colors">
                                                        <td className="py-6 text-center align-middle">
                                                            <div className="h-9 w-20 bg-[#7a0202] text-white rounded-xl flex items-center justify-center shadow-lg group-hover:bg-[#5a0101] transition-colors mx-auto">
                                                                <span className="font-mono text-xs font-black tracking-tighter">{reserva.localizador}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 text-center align-middle">
                                                            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-gray-700">
                                                                <span>{reserva.fecha_entrada}</span>
                                                                <span className="text-gray-400">→</span>
                                                                <span>{reserva.fecha_salida}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 text-center align-middle text-xs font-black text-gray-900">
                                                            {reserva.noches}
                                                        </td>
                                                        <td className="py-6 text-center align-middle font-black text-gray-900 text-sm italic">
                                                            {reserva.monto_total}
                                                        </td>
                                                        <td className="py-6 text-center align-middle">
                                                            <Badge
                                                                label={reserva.estado}
                                                                tipo={reserva.estado?.toLowerCase() === 'completada' ? 'completado' : reserva.estado?.toLowerCase() === 'confirmada' ? 'confirmado' : reserva.estado?.toLowerCase() === 'en curso' ? 'en_estancia' : reserva.estado?.toLowerCase() === 'cancelada' ? 'cancelado' : 'pendiente'}
                                                            />
                                                        </td>
                                                        <td className="py-6 text-center align-middle">
                                                            <Link
                                                                href={`/reservas/${reserva.id}`}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 hover:bg-gray-100 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-gray-200"
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
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: SEGURIDAD */}
                        {activeTab === 'seguridad' && (
                            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10 text-center md:text-left">
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-1">Protección de Cuenta</h3>
                                    <p className="text-xs text-white/60 font-medium">Asegura tu cuenta actualizando la contraseña periódicamente</p>
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
