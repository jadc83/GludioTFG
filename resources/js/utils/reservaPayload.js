/**
 * Utilidades para construir el payload mínimo de reserva que envía el frontend.
 * El backend es la fuente de verdad y realizará validaciones adicionales.
 */
export function mapHabitaciones(habitacionesSeleccionadas = {}) {
  return Object.entries(habitacionesSeleccionadas || {})
    .filter(([, r]) => r.cantidad > 0)
    .map(([tipo, r]) => ({
      tipo,
      cantidad: r.cantidad,
      personas_por_habitacion: Number(r.personas) > 0 ? Number(r.personas) : 1,
    }));
}

export function toIsoDate(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function getReservaPayload({ getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual }) {
  const values = typeof getValues === 'function' ? getValues() : getValues || {};
  const habitaciones = mapHabitaciones(habitacionesSeleccionadas);

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
    reservable_id: idClienteSeleccionado,
    tipo_usuario: tipoClienteSeleccionado || 'cliente',
    booked_by_user_id: usuarioActual?.id || null,
  };
}

export default { mapHabitaciones, getReservaPayload, toIsoDate };
