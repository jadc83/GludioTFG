import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { CalendarIcon, CreditCardIcon, UserIcon, LockClosedIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

export default function Edit({ mustVerifyEmail, status, auth, reservas = [] }) {
    const [activeTab, setActiveTab] = useState('informacion');

    const tabs = [
        { id: 'informacion', label: 'Información', icon: UserIcon },
        { id: 'reservas', label: 'Mis Reservas', icon: CalendarIcon },
        { id: 'seguridad', label: 'Seguridad', icon: LockClosedIcon },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Mi Perfil
                </h2>
            }
        >
            <Head title="Mi Perfil" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Tabs Navigation */}
                    <div className="mb-6 flex w-full justify-center rounded-lg bg-base-200 p-1">
                            <div className="inline-flex gap-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                                activeTab === tab.id
                                                    ? 'bg-white shadow-sm ring-1 ring-black/5 tab-active-1366'
                                                    : 'text-gray-700 hover:bg-gray-200/50'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="rounded-lg bg-white shadow p-6 md:p-8">
                        {/* Información */}
                        {activeTab === 'informacion' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-3xl font-bold mb-8 accent-1366">
                                        Datos Personales
                                    </h3>

                                    {/* Datos actuales del usuario */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 pb-10 border-b-2 border-gray-200">
                                        <div className="p-4 rounded-lg bg-muted-1366">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Nombre</p>
                                            <p className="text-lg font-semibold mt-2 accent-1366">{auth.user.name || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted-1366">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Email</p>
                                            <p className="text-lg font-semibold mt-2 accent-1366">{auth.user.email || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted-1366">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Tipo de Documento</p>
                                            <p className="text-lg font-semibold mt-2 accent-1366">{auth.user.tipo_documento || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted-1366">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Número de Documento</p>
                                            <p className="text-lg font-semibold mt-2 accent-1366">{auth.user.numero_documento || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted-1366">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Nacionalidad</p>
                                            <p className="text-lg font-semibold mt-2 accent-1366">{auth.user.nacionalidad || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted-1366">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Teléfono</p>
                                            <p className="text-lg font-semibold mt-2 accent-1366">{auth.user.telefono || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg lg:col-span-3 bg-muted-1366">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Dirección</p>
                                            <p className="text-lg font-semibold mt-2 accent-1366">{auth.user.direccion || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Formulario de edición */}
                                <div>
                                    <h3 className="text-3xl font-bold mb-8 accent-1366">
                                        Editar Información
                                    </h3>
                                    <UpdateProfileInformationForm
                                        mustVerifyEmail={mustVerifyEmail}
                                        status={status}
                                        className="max-w-2xl"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reservas */}
                        {activeTab === 'reservas' && (
                            <div className="space-y-6">
                                <h3 className="text-3xl font-bold accent-1366">
                                    Mis Reservas
                                </h3>

                                {reservas.length === 0 ? (
                                        <div className="text-center py-12">
                                        <p className="text-gray-600 mb-6 text-lg">📭 Aún no tienes reservas</p>
                                        <Link
                                            href="/"
                                            className="inline-block px-8 py-3 rounded-lg font-semibold transition-colors duration-200 btn-accent-1366"
                                        >
                                            Hacer una Reserva
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-accent-1366">
                                                    <th className="text-left py-4 px-4 font-bold text-white">Habitación</th>
                                                    <th className="text-left py-4 px-4 font-bold text-white">
                                                        <CalendarIcon className="inline w-4 h-4 mr-2" />
                                                        Entrada
                                                    </th>
                                                    <th className="text-left py-4 px-4 font-bold text-white">
                                                        <CalendarIcon className="inline w-4 h-4 mr-2" />
                                                        Salida
                                                    </th>
                                                    <th className="text-left py-4 px-4 font-bold text-white">Noches</th>
                                                    <th className="text-left py-4 px-4 font-bold text-white">
                                                        <CreditCardIcon className="inline w-4 h-4 mr-2" />
                                                        Total
                                                    </th>
                                                    <th className="text-left py-4 px-4 font-bold text-white">Estado</th>
                                                    <th className="text-left py-4 px-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reservas.map((reserva, idx) => (
                                                    <tr key={reserva.id} className={`border-b transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                                        <td className="py-4 px-4 font-semibold text-gray-900">Habitación {reserva.habitacion.numero}</td>
                                                        <td className="py-4 px-4 text-gray-700">{reserva.fecha_entrada}</td>
                                                        <td className="py-4 px-4 text-gray-700">{reserva.fecha_salida}</td>
                                                        <td className="py-4 px-4 text-gray-700">{reserva.noches}</td>
                                                        <td className="py-4 px-4 font-bold accent-1366">{reserva.monto_total}</td>
                                                        <td className="py-4 px-4">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                    reserva.estado === 'Completada' ? 'status-completada-1366' :
                                                                    reserva.estado === 'Confirmada' ? 'status-confirmada-1366' :
                                                                    reserva.estado === 'En curso' ? 'status-encurso-1366' :
                                                                    reserva.estado === 'Cancelada' ? 'status-cancelada-1366' : 'status-default-1366'
                                                                }`}
                                                            >
                                                                {reserva.estado}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex gap-3 items-center">
                                                                <Link
                                                                    href={`/reservas/${reserva.id}`}
                                                                    className="text-sm font-bold underline transition-colors accent-1366 link-accent-1366"
                                                                >
                                                                    Ver
                                                                </Link>
                                                                {/* El botón de reembolso se muestra ahora en la vista detalle de la reserva */}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Seguridad */}
                        {activeTab === 'seguridad' && (
                            <div className="space-y-6">
                                <h3 className="text-3xl font-bold accent-1366">
                                    Cambiar Contraseña
                                </h3>
                                <UpdatePasswordForm className="max-w-2xl" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
