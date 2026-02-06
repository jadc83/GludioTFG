import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function ShowEmpleado({ empleado, abierto, onCerrar }) {
    const [limpiezaHabitaciones, setLimpiezaHabitaciones] = useState(null);

    useEffect(() => {
        if (abierto) {
            // Cargar habitaciones en estado 'limpieza'
            fetch('/habitaciones?estado=limpieza', {
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
            })
                .then(async (r) => {
                    if (!r.ok) {
                        // Si no autenticado o error, dejar array vacío y loguear
                        console.error('ShowEmpleado: fetch /habitaciones returned status', r.status);
                        setLimpiezaHabitaciones([]);
                        return;
                    }
                    const data = await r.json();
                    // El endpoint puede devolver directamente un array o un objeto con key 'habitaciones'
                    if (Array.isArray(data)) {
                        setLimpiezaHabitaciones(data);
                    } else if (Array.isArray(data.habitaciones)) {
                        setLimpiezaHabitaciones(data.habitaciones);
                    } else {
                        console.warn('ShowEmpleado: unexpected response shape', data);
                        setLimpiezaHabitaciones([]);
                    }
                })
                .catch(() => setLimpiezaHabitaciones([]));
        } else {
            setLimpiezaHabitaciones(null);
        }
    }, [abierto]);

    return (
        <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`} onClick={onCerrar} />

            <div className={`absolute bottom-0 right-0 top-0 flex w-full max-w-3xl transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}>
                <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">{empleado?.name || 'Empleado'}</h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Detalle de Empleado</p>
                    </div>
                    <button onClick={onCerrar} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"><XMarkIcon className="h-6 w-6"/></button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="col-span-1 rounded-xl border border-gray-100 p-4">
                            <h4 className="font-black uppercase text-sm text-gray-700">Información</h4>
                            <div className="mt-3 text-sm">
                                <div className="font-bold">{empleado?.name}</div>
                                <div className="text-xs text-gray-400">{empleado?.email}</div>
                                <div className="text-xs mt-2">Rol: <strong>{empleado?.role || '—'}</strong></div>
                                <div className="text-xs">Departamento: <strong>{empleado?.departamento || '—'}</strong></div>
                                <div className="text-xs">Puesto: <strong>{empleado?.puesto || '—'}</strong></div>
                            </div>
                        </div>

                        <div className="col-span-2 rounded-xl border border-gray-100 p-4">
                            <h4 className="font-black uppercase text-sm text-gray-700">Habitaciones en Limpieza</h4>

                            {!Array.isArray(limpiezaHabitaciones) ? (
                                <div className="p-6 text-sm text-gray-500">Cargando habitaciones...</div>
                            ) : limpiezaHabitaciones.length === 0 ? (
                                <div className="p-6 text-sm text-gray-500">No hay habitaciones en limpieza.</div>
                            ) : (
                                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {limpiezaHabitaciones.map((h) => (
                                        <div key={h.id} className="rounded-lg border border-gray-100 p-4">
                                            <div className="font-black uppercase text-sm">{h.numero || h.tipo}</div>
                                            <div className="text-xs text-gray-500">Tipo: {h.tipo}</div>
                                            <div className="text-xs text-gray-500">Capacidad: {h.capacidad}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
