import EditHabitacion from '@/Components/habitaciones/formulario/EditHabitacion';
import { EyeIcon, InboxIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

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
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <InboxIcon className="h-24 w-24 text-gray-300" />
                        <div className="text-center">
                            <p className="mb-2 text-xl font-semibold text-gray-600">
                                No hay habitaciones registradas
                            </p>
                            <p className="text-gray-400">
                                Crea una nueva habitación para comenzar
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
                        <div className="overflow-x-auto p-4">
                            <table className="table-compact table-pro table w-full">
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
                                        <tr
                                            key={habitacion.id}
                                            className="hover"
                                        >
                                            <td className="font-mono font-semibold">
                                                {habitacion.numero}
                                            </td>
                                            <td className="capitalize">
                                                {habitacion.tipo}
                                            </td>
                                            <td>
                                                <span className="badge badge-outline badge-sm">
                                                    {habitacion.capacidad}{' '}
                                                    persona
                                                    {habitacion.capacidad > 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                            </td>
                                            <td className="font-mono text-sm">
                                                €
                                                {parseFloat(
                                                    habitacion.precio_noche ||
                                                        0,
                                                ).toFixed(2)}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${obtenerColorEstado(habitacion.estado)} gap-2 capitalize`}
                                                >
                                                    {habitacion.estado}
                                                </span>
                                            </td>
                                            <td className="max-w-xs">
                                                {habitacion.descripcion || (
                                                    <span className="text-xs italic text-gray-400">
                                                        Sin descripción
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="btn btn-ghost btn-outline btn-sm"
                                                        title="Ver habitación"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        title="Editar habitación"
                                                        onClick={() =>
                                                            abrirEdicion(
                                                                habitacion,
                                                            )
                                                        }
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
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
                    <div className="mt-4 flex justify-center text-sm text-gray-600">
                        Mostrando {habitaciones.length} habitacion
                        {habitaciones.length !== 1 ? 'es' : ''}
                    </div>
                )}
            </div>
            <EditHabitacion
                habitacion={habitacionEditar}
                abierto={drawerAbierto}
                onCerrar={cerrarEdicion}
            />
        </>
    );
}
