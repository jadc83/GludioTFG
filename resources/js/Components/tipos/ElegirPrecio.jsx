import React, { useState } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ElegirPrecio({ tiposHabitacion = [] }) {
  const [tipos, setTipos] = useState(tiposHabitacion);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({});

  const iniciarEdicion = (tipo) => {
    setEditando(tipo.id);
    setFormData({ ...tipo });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio_base' ? parseFloat(value) : value
    }));
  };

  const guardarCambios = async (id) => {
    try {
      const response = await fetch(`/api/tipos-habitacion/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setTipos(prev => prev.map(t => t.id === id ? formData : t));
        setEditando(null);
        setFormData({});
      } else {
        console.error('Error al guardar los cambios');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-[#920303]">Precios de Habitaciones</h2>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Capacidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Precio Base
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="hover:bg-gray-50 transition-colors">
                {editando === tipo.id ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        disabled
                        className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        name="capacidad"
                        value={formData.capacidad}
                        onChange={handleChange}
                        className="rounded border border-gray-300 px-2 py-1 text-sm w-20"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        name="precio_base"
                        value={formData.precio_base}
                        onChange={handleChange}
                        step="0.01"
                        className="rounded border border-gray-300 px-2 py-1 text-sm w-32"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        onClick={() => guardarCambios(tipo.id)}
                        className="inline-flex items-center gap-1 rounded bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Guardar
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="inline-flex items-center gap-1 rounded bg-gray-500 px-3 py-1 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {tipo.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tipo.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tipo.capacidad} personas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#920303]">
                      {parseFloat(tipo.precio_base).toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => iniciarEdicion(tipo)}
                        className="inline-flex items-center gap-1 rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
