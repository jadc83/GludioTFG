import { useState } from 'react';
import EditHabitacion from '@/Components/habitaciones/EditHabitacion';
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

    if (habitaciones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <InboxIcon className="w-24 h-24 text-gray-300" />
                <div className="text-center">
                    <p className="text-gray-600 text-xl font-semibold mb-2">No hay habitaciones registradas</p>
                    <p className="text-gray-400">Crea una nueva habitación para comenzar</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {habitaciones.map((habitacion) => (
                <div key={habitacion.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="card-body">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h2 className="font-bold text-sm">Habitación {habitacion.numero}</h2>
                                <p className="text-xs text-gray-600 capitalize mt-1">{habitacion.tipo}</p>
                            </div>
                            <div className={`badge ${obtenerColorEstado(habitacion.estado)} badge-xs capitalize font-medium`}>
                                {habitacion.estado}
                            </div>
                        </div>

                        <div className="divider my-1"></div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Capacidad:</span>
                                <span className="badge badge-outline badge-sm">{habitacion.capacidad} pers.</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Precio/noche:</span>
                                <span className="text-base font-bold text-primary">{habitacion.precio_noche}€</span>
                            </div>
                        </div>

                        {habitacion.descripcion && (
                            <>
                                <div className="divider my-1"></div>
                                <p className="text-xs text-gray-600 line-clamp-2">{habitacion.descripcion}</p>
                            </>
                        )}

                        <div className="card-actions justify-end mt-3 gap-2">
                            <button className="btn btn-sm btn-ghost btn-outline">
                                <EyeIcon className="w-4 h-4" />
                            </button>
                            <button className="btn btn-sm btn-primary" onClick={() => abrirEdicion(habitacion)}>
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <EditHabitacion habitacion={habitacionEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion}/>
    </>
  );
}
