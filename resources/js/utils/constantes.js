/**
 * Constantes y configuración centralizada
 */

// Tipos de habitación
export const TIPOS_HABITACION = {
    DOBLE: 'doble',
    SUITE: 'suite',
    FAMILIAR: 'familiar',
};

export const NOMBRES_HABITACION = {
    doble: 'Doble',
    suite: 'Suite',
    familiar: 'Familiar',
};

// Las capacidades ya provienen de la tabla `tipos_habitacion` en el servidor.
// Mantener este bloque aquí está obsoleto; usar `tiposHabitacion` inyectado por Inertia.

// Estados de reserva
export const ESTADOS_RESERVA = {
    PENDIENTE: 'pendiente',
    CONFIRMADA: 'confirmada',
    CANCELADA: 'cancelada',
    COMPLETADA: 'completada',
};

// Estados de habitación
export const ESTADOS_HABITACION = {
    DISPONIBLE: 'disponible',
    OCUPADA: 'ocupada',
    MANTENIMIENTO: 'mantenimiento',
    LIMPIEZA: 'limpieza',
};

// Tipos de documento
export const TIPOS_DOCUMENTO = {
    DNI: 'dni',
    PASAPORTE: 'pasaporte',
    TIE: 'tie',
};

// Opciones de pago
export const OPCIONES_PAGO = {
    TARJETA: 'tarjeta',
    TRANSFERENCIA: 'transferencia',
    AL_LLEGAR: 'al_llegar',
};

// Configuración de paginación
export const PAGINACION = {
    ITEMS_POR_PAGINA_TABLA: 10,
    ITEMS_POR_PAGINA_HABITACIONES: 6,
    ITEMS_POR_PAGINA_CLIENTES: 10,
};

// Configuración de reservas
export const CONFIG_RESERVAS = {
    NOCHES_MINIMAS: 1,
    NOCHES_MAXIMAS: 365,
    DIAS_MINIMOS_PARA_RESERVAR: 0, // Hoy mismo
    DESCUENTO_LARGO_PLAZO_DIAS: 7, // Aplica descuento después de 7 noches
    DESCUENTO_LARGO_PLAZO_PORCENTAJE: 10,
    MAX_HABITACIONES_POR_RESERVA: 10,
};

// Configuración de fotos
export const CONFIG_FOTOS = {
    MAX_FOTOS_HABITACION: 4,
    MAX_TAMAÑO_FOTO_MB: 2,
    TAMAÑO_THUMBNAIL_PX: 200,
};

// Monedas
export const MONEDAS = {
    EUR: '€',
    USD: '$',
    GBP: '£',
};

// Rangos de precios para filtros
export const RANGOS_PRECIOS = {
    MIN: 0,
    MAX: 999,
    STEP: 10,
};

// Rutas API
export const RUTAS_API = {
    RESERVAS: '/api/reservas',
    HABITACIONES: '/api/habitaciones',
    CLIENTES: '/api/clientes',
    USUARIOS: '/api/usuarios',
    PAGOS: '/api/pagos',
};

// Rutas de panel
export const RUTAS_PANEL = {
    PANEL: '/panel',
    CLIENTES: '/panel/clientes',
    HABITACIONES: '/panel/habitaciones',
    RESERVAS: '/panel/reservas',
};

// Errores comunes
export const MENSAJES_ERROR = {
    FECHAS_INVALIDAS: 'Las fechas proporcionadas no son válidas',
    FECHA_SALIDA_ANTERIOR: 'La fecha de salida debe ser posterior a la de entrada',
    HABITACIONES_NO_DISPONIBLES: 'Las habitaciones seleccionadas no están disponibles para esas fechas',
    CLIENTE_NO_ENCONTRADO: 'El cliente no fue encontrado',
    RESERVA_NO_ENCONTRADA: 'La reserva no fue encontrada',
    ERROR_GENERAL: 'Ocurrió un error. Intenta nuevamente',
};

// Mensajes de éxito
export const MENSAJES_EXITO = {
    RESERVA_CREADA: 'Reserva creada exitosamente',
    RESERVA_ACTUALIZADA: 'Reserva actualizada exitosamente',
    CLIENTE_CREADO: 'Cliente creado exitosamente',
    CLIENTE_ACTUALIZADO: 'Cliente actualizado exitosamente',
    HABITACION_CREADA: 'Habitación creada exitosamente',
    HABITACION_ACTUALIZADA: 'Habitación actualizada exitosamente',
};

export default {
    TIPOS_HABITACION,
    NOMBRES_HABITACION,
    ESTADOS_RESERVA,
    ESTADOS_HABITACION,
    TIPOS_DOCUMENTO,
    OPCIONES_PAGO,
    PAGINACION,
    CONFIG_RESERVAS,
    CONFIG_FOTOS,
    MONEDAS,
    RANGOS_PRECIOS,
    RUTAS_API,
    RUTAS_PANEL,
    MENSAJES_ERROR,
    MENSAJES_EXITO,
};
