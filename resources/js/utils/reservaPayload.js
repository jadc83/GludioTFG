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
  // Si ya viene en formato 'YYYY-MM-DD' devuelvo tal cual (evita reinterpretación)
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  // Normalizar objetos Date evitando toISOString() que convierte a UTC
  // y puede devolver el día anterior según la zona horaria del navegador.
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
