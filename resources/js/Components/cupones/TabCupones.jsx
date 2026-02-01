import { useState } from 'react';
import { router } from '@inertiajs/react';
import { TicketIcon } from '@heroicons/react/24/outline';
import Badge from '@/Components/UI/Badge';

export default function TabCupones({ cupones = {} }) {
    const [refrescando, setRefrescando] = useState(false);

    const handleDelete = (id) => {
        if (!confirm('¿Eliminar este cupón?')) return;

        router.delete(route('cupones.destroy', id), {
            onSuccess: () => {
                setRefrescando(prev => !prev);
            }
        });
    };

    const handleToggle = (id) => {
        router.post(route('cupones.toggle', id), {}, {
            onSuccess: () => {
                setRefrescando(prev => !prev);
            }
        });
    };

    const getEstadoBadge = (cupon) => {
        if (!cupon.activo) {
            return <Badge label="Inactivo" tipo="inactivo" />;
        }

        const ahora = new Date();
        const inicio = new Date(cupon.fecha_inicio);
        const fin = new Date(cupon.fecha_fin);

        if (ahora < inicio) {
            return <Badge label="Próximo" tipo="proximo" />;
        }
        if (ahora > fin) {
            return <Badge label="Expirado" tipo="expirado" />;
        }
        return <Badge label="Activo" tipo="activo" />;
    };

    const getValorTexto = (cupon) => {
        return cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : `${cupon.valor}€`;
    };

    const cuponesData = cupones.data || [];

    return (
        <div className="p-3 md:p-6 space-y-6">
            {/* --- CABECERA --- */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Gestión de <span className="text-[#7a0202]">Cupones</span></h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Códigos promocionales y descuentos</p>
                </div>
                <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <TicketIcon className="h-6 w-6 text-gray-400" />
                </div>
            </div>

            {/* --- BARRA DE ACCIONES --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div>
                    <p className="text-sm font-semibold text-gray-700">Total de cupones: <span className="text-[#7a0202]">{cuponesData.length}</span></p>
                </div>
            </div>

            {/* --- TABLA DE CUPONES --- */}

            {/* --- TABLA DE CUPONES --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {cuponesData.length === 0 ? (
                    <div className="p-12 text-center">
                        <TicketIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No hay cupones registrados</p>
                        <p className="text-gray-400 text-sm mt-1">Crea el primero para comenzar</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Código</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Tipo</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Valor</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Usos</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Válido Hasta</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cuponesData.map(cupon => (
                                    <tr key={cupon.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-[#7a0202] text-base">{cupon.codigo}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-medium border border-blue-100">
                                                {cupon.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{getValorTexto(cupon)}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {cupon.usos_realizados}/{cupon.usos_maximos || '∞'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(cupon.fecha_fin).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getEstadoBadge(cupon)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setFormData(cupon);
                                                        setEditingId(cupon.id);
                                                        setShowForm(true);
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleToggle(cupon.id)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                        cupon.activo
                                                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    }`}
                                                >
                                                    {cupon.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                                {cupon.usos_realizados === 0 && (
                                                    <button
                                                        onClick={() => handleDelete(cupon.id)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
