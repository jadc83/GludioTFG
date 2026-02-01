/**
 * Componente Badge - Estilo uniforme para etiquetas/estados en toda la app
 * Define una única fuente de verdad para badges
 */
export default function Badge({ label, tipo = 'default', className = '' }) {
    const tiposDisponibles = {
        // Estados positivos
        confirmado: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        activo: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        disponible: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        aprobado: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        pagado: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        completado: 'bg-emerald-50 text-emerald-700 border border-emerald-100',

        // Estados en progreso
        en_estancia: 'bg-amber-50 text-amber-700 border border-amber-100',
        proximo: 'bg-amber-50 text-amber-700 border border-amber-100',
        pendiente: 'bg-purple-50 text-purple-700 border border-purple-100',
        procesando: 'bg-purple-50 text-purple-700 border border-purple-100',

        // Estados negativos
        cancelado: 'bg-rose-50 text-rose-700 border border-rose-100',
        inactivo: 'bg-rose-50 text-rose-700 border border-rose-100',
        expirado: 'bg-gray-100 text-gray-700 border border-gray-200',
        no_presentado: 'bg-gray-100 text-gray-700 border border-gray-200',
        rechazado: 'bg-rose-50 text-rose-700 border border-rose-100',

        // Estados de reembolso
        reembolso_pendiente: 'bg-amber-50 text-amber-700 border border-amber-100',
        reembolso_parcial: 'bg-orange-50 text-orange-700 border border-orange-100',
        reembolso_total: 'bg-blue-50 text-blue-700 border border-blue-100',
        devuelto: 'bg-sky-50 text-sky-700 border border-sky-100',

        // Otros
        default: 'bg-gray-50 text-gray-700 border border-gray-200',
        info: 'bg-blue-50 text-blue-700 border border-blue-100',
        porcentaje: 'bg-blue-50 text-blue-700 border border-blue-100',
        monto_fijo: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    };

    const estilos = tiposDisponibles[tipo] || tiposDisponibles.default;

    return (
        <span className={`inline-block text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${estilos} ${className}`}>
            {label}
        </span>
    );
}
