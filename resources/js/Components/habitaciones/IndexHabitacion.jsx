import { useState } from 'react';
import EditHabitacion from '@/Components/habitaciones/formulario/EditHabitacion';
import { InboxIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function IndexHabitacion({ habitaciones = [] }) {
    const [habitacionEditar, setHabitacionEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    const abrirEdicion = (habitacion) => {
        setHabitacionEditar(habitacion);
        setDrawerAbierto(true);
    };

    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setHabitacionEditar(null), 300);
    };

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'disponible':
                return 'badge-success';
            case 'ocupada':
                return 'badge-error';
            case 'mantenimiento':
                return 'badge-warning';
            case 'limpieza':
                return 'badge-info';
            default:
                return 'badge-neutral';
        }
    };

    return (
        <>
            <div className="table-pro-wrapper">
                {habitaciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <InboxIcon className="w-24 h-24 text-gray-300" />
                        <div className="text-center">
                            <p className="text-gray-600 text-xl font-semibold mb-2">No hay habitaciones registradas</p>
                            <p className="text-gray-400">Crea una nueva habitación para comenzar</p>
                        </div>
                    </div>
                ) : (
                    <div className="card bg-white shadow-lg rounded-lg overflow-hidden table-card">
                        <div className="p-4 overflow-x-auto">
                            <table className="table table-compact w-full table-pro">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Tipo</th>
                                <th>Capacidad</th>
                                <th>Precio/Noche</th>
                                <th>Estado</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {habitaciones.map((habitacion) => (
                                <tr key={habitacion.id} className="hover">
                                    <td className="font-mono font-semibold">{habitacion.numero}</td>
                                    <td className="capitalize">{habitacion.tipo}</td>
                                    <td>
                                        <span className="badge badge-outline badge-sm">
                                            {habitacion.capacidad} persona{habitacion.capacidad > 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="font-mono text-sm">
                                        €{parseFloat(habitacion.precio_noche || 0).toFixed(2)}
                                    </td>
                                    <td>
                                        <span className={`badge ${obtenerColorEstado(habitacion.estado)} gap-2 capitalize`}>
                                            {habitacion.estado}
                                        </span>
                                    </td>
                                    <td className="max-w-xs">
                                        {habitacion.descripcion || <span className="text-gray-400 text-xs italic">Sin descripción</span>}
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button className="btn btn-sm btn-ghost btn-outline" title="Ver habitación">
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button className="btn btn-sm btn-primary" title="Editar habitación" onClick={() => abrirEdicion(habitacion)}>
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {habitaciones.length > 0 && (
                    <div className="flex justify-center mt-4 text-sm text-gray-600">
                        Mostrando {habitaciones.length} habitacion{habitaciones.length !== 1 ? 'es' : ''}
                    </div>
                )}
            </div>
            <EditHabitacion habitacion={habitacionEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion}/>
        </>
    );
}
