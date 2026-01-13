import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
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
                                                ? 'bg-white shadow-sm ring-1 ring-black/5'
                                                : 'text-gray-700 hover:bg-gray-200/50'
                                        }`}
                                        style={activeTab === tab.id ? { color: '#920303' } : {}}
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
                                    <h3 className="text-3xl font-bold mb-8" style={{ color: '#7a0202' }}>
                                        Datos Personales
                                    </h3>

                                    {/* Datos actuales del usuario */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 pb-10 border-b-2 border-gray-200">
                                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f3f0' }}>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Nombre</p>
                                            <p className="text-lg font-semibold mt-2" style={{ color: '#7a0202' }}>{auth.user.name || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f3f0' }}>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Email</p>
                                            <p className="text-lg font-semibold mt-2" style={{ color: '#7a0202' }}>{auth.user.email || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f3f0' }}>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Tipo de Documento</p>
                                            <p className="text-lg font-semibold mt-2" style={{ color: '#7a0202' }}>{auth.user.tipo_documento || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f3f0' }}>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Número de Documento</p>
                                            <p className="text-lg font-semibold mt-2" style={{ color: '#7a0202' }}>{auth.user.numero_documento || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f3f0' }}>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Nacionalidad</p>
                                            <p className="text-lg font-semibold mt-2" style={{ color: '#7a0202' }}>{auth.user.nacionalidad || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f5f3f0' }}>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Teléfono</p>
                                            <p className="text-lg font-semibold mt-2" style={{ color: '#7a0202' }}>{auth.user.telefono || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg lg:col-span-3" style={{ backgroundColor: '#f5f3f0' }}>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Dirección</p>
                                            <p className="text-lg font-semibold mt-2" style={{ color: '#7a0202' }}>{auth.user.direccion || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Formulario de edición */}
                                <div>
                                    <h3 className="text-3xl font-bold mb-8" style={{ color: '#7a0202' }}>
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
                                <h3 className="text-3xl font-bold" style={{ color: '#7a0202' }}>
                                    Mis Reservas
                                </h3>

                                {reservas.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-600 mb-6 text-lg">📭 Aún no tienes reservas</p>
                                        <Link
                                            href="/"
                                            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-200"
                                            style={{ backgroundColor: '#7a0202' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#920303'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#7a0202'}
                                        >
                                            Hacer una Reserva
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr style={{ backgroundColor: '#7a0202' }}>
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
                                                        <td className="py-4 px-4 font-bold" style={{ color: '#7a0202' }}>{reserva.monto_total}</td>
                                                        <td className="py-4 px-4">
                                                            <span
                                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                                style={{
                                                                    backgroundColor: reserva.estado === 'Completada' ? '#d1fae5' :
                                                                                   reserva.estado === 'Confirmada' ? '#dbeafe' :
                                                                                   reserva.estado === 'En curso' ? '#fef08a' :
                                                                                   reserva.estado === 'Cancelada' ? '#fee2e2' : '#fef3c7',
                                                                    color: reserva.estado === 'Completada' ? '#065f46' :
                                                                           reserva.estado === 'Confirmada' ? '#1e40af' :
                                                                           reserva.estado === 'En curso' ? '#713f12' :
                                                                           reserva.estado === 'Cancelada' ? '#7f1d1d' : '#92400e'
                                                                }}
                                                            >
                                                                {reserva.estado}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <Link
                                                                href={`/reservas/${reserva.id}`}
                                                                className="text-sm font-bold underline transition-colors"
                                                                style={{ color: '#7a0202' }}
                                                                onMouseEnter={(e) => e.target.style.color = '#920303'}
                                                                onMouseLeave={(e) => e.target.style.color = '#7a0202'}
                                                            >
                                                                Ver
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

                        {/* Seguridad */}
                        {activeTab === 'seguridad' && (
                            <div className="space-y-6">
                                <h3 className="text-3xl font-bold" style={{ color: '#7a0202' }}>
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
