export function mapHabitaciones(habitacionesSeleccionadas = {}) {
    return Object.entries(habitacionesSeleccionadas || {})
        .filter(([, r]) => r.cantidad > 0)
        .map(([tipo, r]) => ({
            tipo,
            cantidad: r.cantidad,
            personas_por_habitacion:
                Number(r.personas) > 0 ? Number(r.personas) : 1,
        }));
}

export function toIsoDate(date) {
    if (!date) return null;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
        return date;

    const fecha = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function getReservaPayload({
    getValues,
    rango,
    habitacionesSeleccionadas,
    idClienteSeleccionado,
    tipoClienteSeleccionado,
    usuarioActual,
    tarifasSeleccionadas = [],
    cupon_id = null,
}) {
    const values =
        typeof getValues === 'function' ? getValues() : getValues || {};
    const habitaciones = mapHabitaciones(habitacionesSeleccionadas);

    if (
        process.env.NODE_ENV !== 'production' &&
        (!rango || !rango.from || !rango.to)
    ) {
        // Ayuda al debug local cuando las fechas no están presentes
        try {
            console.debug('getReservaPayload: rango incompleto', {
                rango,
                habitacionesSeleccionadas,
                values,
            });
        } catch (e) {}
    }


    const reservableId =
        idClienteSeleccionado !== undefined && idClienteSeleccionado !== null
            ? idClienteSeleccionado
            : (usuarioActual?.id ?? null);
    const tipoUsuario =
        idClienteSeleccionado !== undefined && idClienteSeleccionado !== null
            ? tipoClienteSeleccionado || 'cliente'
            : usuarioActual
              ? 'usuario'
              : tipoClienteSeleccionado || 'cliente';

    return {
        name: values.name,
        email: values.email,
        telefono: values.telefono,
        tipo_documento: values.tipo_documento,
        numero_documento: values.numero_documento,
        nacionalidad: values.nacionalidad,
        direccion: values.direccion,
        check_in: toIsoDate(rango?.from),
        check_out: toIsoDate(rango?.to),
        habitaciones,
        tarifas: Array.isArray(tarifasSeleccionadas)
            ? tarifasSeleccionadas
            : Object.keys(tarifasSeleccionadas || {})
                  .filter((k) => tarifasSeleccionadas[k])
                  .map(Number),
        reservable_id: reservableId,
        tipo_usuario: tipoUsuario,
        booked_by_user_id: usuarioActual?.id || null,
        cupon_id: cupon_id || null,
    };
}

export default { mapHabitaciones, getReservaPayload, toIsoDate };
