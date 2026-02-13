export function getEstadoConfig(estado) {
    const configEstado = {
        disponible: {
            clase: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            label: 'Disponible',
        },
        ocupada: {
            clase: 'bg-rose-50 text-rose-700 border-rose-100',
            label: 'Ocupada',
        },
        mantenimiento: {
            clase: 'bg-amber-50 text-amber-700 border-amber-100',
            label: 'Mantenimiento',
        },
        limpieza: {
            clase: 'bg-sky-50 text-sky-700 border-sky-100',
            label: 'Limpieza',
        },
        default: {
            clase: 'bg-gray-50 text-gray-500 border-gray-100',
            label: 'Desconocido',
        },
    };

    return configEstado[estado] || configEstado.default;
}
