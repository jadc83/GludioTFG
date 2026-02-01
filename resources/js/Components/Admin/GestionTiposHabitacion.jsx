import React, { useState, useEffect } from 'react';
import PrimaryButton from '@/Components/UI/PrimaryButton';

export default function GestionTiposHabitacion() {
    const [tipos, setTipos] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        slug: '',
        capacidad: '',
        precio_base: '',
    });

    // Cargar tipos
    useEffect(() => {
        cargarTipos();
    }, []);

    const cargarTipos = async () => {
        try {
            const response = await fetch('/api/tipos-habitaciones/list');
            const data = await response.json();
            setTipos(data.data);
        } catch (err) {
            setError('Error al cargar tipos');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const method = editingId ? 'PATCH' : 'POST';
            const url = editingId
                ? `/api/tipos-habitaciones/${editingId}`
                : '/api/tipos-habitaciones';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la operación');
            }

            setSuccess(data.message || (editingId ? 'Tipo actualizado' : 'Tipo creado'));
            setFormData({ nombre: '', slug: '', capacidad: '', precio_base: '' });
            setEditingId(null);
            setShowForm(false);
            cargarTipos();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tipo) => {
        setFormData({
            nombre: tipo.nombre,
            slug: tipo.slug,
            capacidad: tipo.capacidad,
            precio_base: tipo.precio_base,
        });
        setEditingId(tipo.id);
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este tipo?')) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/tipos-habitaciones/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });

            if (!response.ok) throw new Error('Error al eliminar');

            setSuccess('Tipo eliminado correctamente');
            cargarTipos();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setFormData({ nombre: '', slug: '', capacidad: '', precio_base: '' });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    return (
        <div>
            {/* --- CABECERA --- */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Tipos de <span className="text-[#7a0202]">Habitación</span></h2>
                </div>
                <PrimaryButton onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nuevo Tipo'}
                </PrimaryButton>
            </div>

            {/* Mensajes */}
            {error && (
                <div className="alert alert-error mb-2 py-2 px-3 text-sm">
                    <div className="flex-1">
                        <label>{error}</label>
                    </div>
                </div>
            )}
            {success && (
                <div className="alert alert-success mb-2 py-2 px-3 text-sm">
                    <div className="flex-1">
                        <label>{success}</label>
                    </div>
                </div>
            )}

            {/* Formulario */}
            {showForm && (
                <div className="bg-white rounded-lg shadow mb-4 border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-900 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Doble"
                                    required
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-900 mb-1">Slug</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    placeholder="doble"
                                    required
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-900 mb-1">Capacidad</label>
                                <input
                                    type="number"
                                    name="capacidad"
                                    value={formData.capacidad}
                                    onChange={handleInputChange}
                                    placeholder="2"
                                    required
                                    min="1"
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-900 mb-1">Precio (€)</label>
                                <input
                                    type="number"
                                    name="precio_base"
                                    value={formData.precio_base}
                                    onChange={handleInputChange}
                                    placeholder="100"
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-1 justify-end mt-3">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-3 py-1 border border-gray-300 text-gray-700 font-semibold rounded text-xs hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <PrimaryButton disabled={loading}>
                                {loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-2 text-left font-bold text-gray-900">Nombre</th>
                            <th className="px-4 py-2 text-left font-bold text-gray-900">Precio</th>
                            <th className="px-2 py-2 text-right font-bold text-gray-900 w-32">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tipos.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-4 py-4 text-center text-gray-500 text-xs">
                                    No hay tipos registrados
                                </td>
                            </tr>
                        ) : (
                            tipos.map(tipo => (
                                <tr key={tipo.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-900 font-semibold">{tipo.nombre}</td>
                                    <td className="px-4 py-2 text-gray-900 font-semibold">€{parseFloat(tipo.precio_base).toFixed(2)}</td>
                                    <td className="px-2 py-2 space-x-0.5 flex justify-end gap-0.5">
                                        <button
                                            onClick={() => handleEdit(tipo)}
                                            className="px-2 py-0.5 bg-black text-white font-semibold rounded text-xs hover:bg-[#7a0202]"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tipo.id)}
                                            className="px-2 py-0.5 bg-red-600 text-white font-semibold rounded text-xs hover:bg-red-700"
                                            disabled={loading}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
