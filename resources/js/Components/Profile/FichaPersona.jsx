import React from 'react';

export default function FichaPersona({ empleado, auth }) {
    const name = empleado?.name || auth?.user?.name || 'Usuario';
    const initial = (name || 'U').charAt(0).toUpperCase();

    return (
        <div className="rounded-xl bg-white p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Avatar + identidad */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-extrabold text-gray-700">{initial}</div>
                    <div className="mt-3">
                        <div className="text-lg font-extrabold text-gray-800">{name}</div>
                        <div className="text-sm text-gray-500">{empleado?.departamento || (auth?.user?.roles && auth.user.roles.join(', ')) || '—'}</div>
                    </div>
                </div>

                {/* Datos principales organizados */}
                <div className="sm:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-gray-400 uppercase">Contacto</div>
                            <div className="mt-1 text-sm text-gray-700">
                                <div className="font-medium">{empleado?.email || auth?.user?.email || '—'}</div>
                                <div className="text-gray-500">{empleado?.telefono || auth?.user?.telefono || '—'}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-400 uppercase">Identificación</div>
                            <div className="mt-1 text-sm text-gray-700">
                                <div className="font-medium">{empleado?.tipo_documento || auth?.user?.tipo_documento || '—'}</div>
                                <div className="text-gray-500">{empleado?.numero_documento || auth?.user?.numero_documento || '—'}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-400 uppercase">Ubicación</div>
                            <div className="mt-1 text-sm text-gray-700">
                                <div className="font-medium">{empleado?.direccion || auth?.user?.direccion || '—'}</div>
                                <div className="text-gray-500">{empleado?.ciudad || auth?.user?.ciudad || '—'} · {empleado?.codigo_postal || auth?.user?.codigo_postal || '—'}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-400 uppercase">Otros</div>
                            <div className="mt-1 text-sm text-gray-700">
                                <div className="font-medium">Nacionalidad: {empleado?.nacionalidad || auth?.user?.nacionalidad || '—'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Departamento + Encargado (único lugar) */}
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <div className="text-xs text-gray-400 uppercase">Departamento</div>
                        <div className="mt-1 text-sm text-gray-700 font-medium">{empleado?.departamento || '—'}</div>

                        {empleado?.departamento_encargado ? (
                            <div className="mt-3">
                                <div className="text-xs text-gray-400 uppercase">Encargado</div>
                                <div className="mt-1 text-sm text-gray-700 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                    <div className="font-medium">{empleado.departamento_encargado.name}</div>
                                    <div className="text-gray-500">{empleado.departamento_encargado.email || '—'}</div>
                                    <div className="text-gray-500">{empleado.departamento_encargado.telefono || '—'}</div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
