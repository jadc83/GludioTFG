import React from 'react';
import { HomeIcon } from '@heroicons/react/24/outline';
import Campo from '@/Components/reservas/utilidades/Campo';

export default function HabitacionesSelector({
    formulario,
    cargando,
    habitacionesPorTipo = {},
    cambiarCantidadHabitaciones,
}) {
    return (
        <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-[#7a0202] pl-4">
                <HomeIcon className="h-5 w-5 text-[#7a0202]" />
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">
                    Habitaciones Disponibles
                </h4>
            </div>

            {!formulario.check_in || !formulario.check_out ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center">
                    <p className="text-sm text-gray-500">
                        Completa las fechas para ver habitaciones disponibles
                    </p>
                </div>
            ) : cargando ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center">
                    <p className="text-sm text-gray-500">Cargando habitaciones...</p>
                </div>
            ) : Object.keys(habitacionesPorTipo).length === 0 ? (
                <div className="rounded-lg bg-red-50 p-6 text-center">
                    <p className="text-sm text-red-600">
                        No hay habitaciones disponibles para las fechas seleccionadas
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(habitacionesPorTipo).map(([tipo, info]) => (
                        <div
                            key={tipo}
                            className="rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-[#7a0202]"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h5 className="text-sm font-black uppercase text-gray-900">
                                            {tipo}
                                        </h5>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                            {info.disponibles} disponibles
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        €{info.precio} / noche
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            cambiarCantidadHabitaciones(tipo, info.cantidad - 1)
                                        }
                                        disabled={info.cantidad === 0}
                                        className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-700 transition-all hover:border-[#7a0202] hover:bg-red-50 hover:text-[#7a0202] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center text-sm font-bold text-gray-900">
                                        {info.cantidad}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            cambiarCantidadHabitaciones(tipo, info.cantidad + 1)
                                        }
                                        disabled={info.cantidad >= info.disponibles}
                                        className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-gray-700 transition-all hover:border-[#7a0202] hover:bg-red-50 hover:text-[#7a0202] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
