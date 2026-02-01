import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function TabCupones({ cupones = {} }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        codigo: '',
        tipo: 'porcentaje',
        valor: '',
        usos_maximos: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activo: true,
        descripcion: '',
    });
    const [mensaje, setMensaje] = useState(null);

    const resetForm = () => {
        setFormData({
            codigo: '',
            tipo: 'porcentaje',
            valor: '',
            usos_maximos: '',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            activo: true,
            descripcion: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = editingId ? route('cupones.update', editingId) : route('cupones.store');

        router.post(url, {
            ...formData,
            _method: editingId ? 'PUT' : 'POST',
        }, {
            onSuccess: () => {
                setMensaje({ type: 'success', text: editingId ? 'Cupón actualizado' : 'Cupón creado' });
                resetForm();
                setTimeout(() => setMensaje(null), 3000);
            },
            onError: (errors) => {
                setMensaje({ type: 'error', text: 'Error al guardar el cupón' });
            }
        });
    };

    const handleDelete = (id) => {
        if (!confirm('¿Eliminar este cupón?')) return;

        router.delete(route('cupones.destroy', id), {
            onSuccess: () => {
                setMensaje({ type: 'success', text: 'Cupón eliminado' });
                setTimeout(() => setMensaje(null), 3000);
            }
        });
    };

    const handleToggle = (id) => {
        router.post(route('cupones.toggle', id), {}, {
            onSuccess: () => {
                setMensaje({ type: 'success', text: 'Cupón actualizado' });
                setTimeout(() => setMensaje(null), 3000);
            }
        });
    };

    const getEstadoBadge = (cupon) => {
        if (!cupon.activo) {
            return <span className="inline-block bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded">Inactivo</span>;
        }
        const ahora = new Date();
        const inicio = new Date(cupon.fecha_inicio);
        const fin = new Date(cupon.fecha_fin);

        if (ahora < inicio) {
            return <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded">Próximo</span>;
        }
        if (ahora > fin) {
            return <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">Expirado</span>;
        }
        return <span className="inline-block bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded">Activo</span>;
    };

    const getValorTexto = (cupon) => {
        return cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : `€${cupon.valor}`;
    };

    const cuponesData = cupones.data || [];

    return (
        <div className="space-y-6">
            {mensaje && (
                <div className={`p-4 rounded-lg ${mensaje.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {mensaje.text}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gestionar Cupones</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                    {showForm ? '✕ Cerrar' : '+ Nuevo Cupón'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {editingId ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    value={formData.codigo.toUpperCase()}
                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="BIENVENIDA10"
                                    disabled={!!editingId}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipo *
                                </label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="porcentaje">Porcentaje (%)</option>
                                    <option value="monto_fijo">Monto Fijo (€)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Valor {formData.tipo === 'porcentaje' ? '(%)' : '(€)'} *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.valor}
                                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Usos Máximos
                                </label>
                                <input
                                    type="number"
                                    value={formData.usos_maximos}
                                    onChange={(e) => setFormData({ ...formData, usos_maximos: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="100 (vacío = ilimitado)"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fecha Inicio *
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha_inicio}
                                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fecha Fin *
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha_fin}
                                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Visible para usuarios"
                                rows="2"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="activo"
                                type="checkbox"
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="activo" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Cupón activo
                            </label>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                {editingId ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {cuponesData.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No hay cupones registrados. Crea el primero.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Código</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Tipo</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Valor</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Usos</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Válido</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cuponesData.map(cupon => (
                                <tr key={cupon.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{cupon.codigo}</td>
                                    <td className="px-4 py-3 text-xs">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {cupon.tipo === 'porcentaje' ? '%' : '€'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold">{getValorTexto(cupon)}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                        {cupon.usos_realizados}/{cupon.usos_maximos || '∞'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                        hasta {new Date(cupon.fecha_fin).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-4 py-3">{getEstadoBadge(cupon)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setFormData(cupon);
                                                    setEditingId(cupon.id);
                                                    setShowForm(true);
                                                }}
                                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleToggle(cupon.id)}
                                                className={`px-2 py-1 text-xs rounded font-medium transition ${
                                                    cupon.activo
                                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                            >
                                                {cupon.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                            {cupon.usos_realizados === 0 && (
                                                <button
                                                    onClick={() => handleDelete(cupon.id)}
                                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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
                )}
            </div>
        </div>
    );
}
