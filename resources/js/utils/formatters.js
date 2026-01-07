/**
 * Utilidades centralizadas para formateo de datos
 * Usar: import { formatters } from '@/utils/formatters'
 */
export function formatearFecha(fecha, tipo = 'legible') {
    if (!fecha) return '—';

    const date = fecha instanceof Date ? fecha : new Date(fecha);
    const opciones = {
        corta: { day: '2-digit', month: '2-digit', year: 'numeric' },
        legible: { day: 'numeric', month: 'long', year: 'numeric' },
        completa: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        iso: null,
    };

    if (tipo === 'iso') {
        return date.toISOString().split('T')[0];
    }

    return date.toLocaleDateString('es-ES', opciones[tipo] || opciones.legible);
}

/**
 * Formatea una cantidad como moneda
 * @param {number} cantidad
 * @param {string} moneda - 'EUR' | 'USD', etc
 * @returns {string}
 */
export function formatearMoneda(cantidad, moneda = 'EUR') {
    if (cantidad === null || cantidad === undefined) return '—';

    const formateadores = {
        EUR: (n) => `€${n.toFixed(2)}`,
        USD: (n) => `$${n.toFixed(2)}`,
        GBP: (n) => `£${n.toFixed(2)}`,
    };

    const formateador = formateadores[moneda] || formateadores.EUR;
    return formateador(Number(cantidad));
}

/**
 * Obtiene el nombre completo de un tipo de documento
 * Se repite en 3 componentes
 * @param {string} tipo - 'dni' | 'nie' | 'pasaporte' | 'tie'
 * @returns {string}
 */
export function obtenerNombreDocumento(tipo) {
    const nombres = {
        dni: 'DNI',
        nie: 'NIE',
        pasaporte: 'Pasaporte',
        tie: 'TIE'
    };

    return nombres[tipo?.toLowerCase()] || tipo || '—';
}

/**
 * Obtiene el color (clase Tailwind/DaisyUI) para un tipo de documento
 */
export function obtenerColorDocumento(tipo) {
    const colores = {
        dni: 'badge-success',
        nie: 'badge-info',
        pasaporte: 'badge-warning',
        tie: 'badge-secondary'
    };

    return colores[tipo?.toLowerCase()] || 'badge-neutral';
}

/**
 * Obtiene las opciones disponibles de tipos de documento
 * Para usar en selects
 */
export function obtenerOpcionesDocumento() {
    return [
        { value: 'dni', label: 'DNI' },
        { value: 'pasaporte', label: 'Pasaporte' },
        { value: 'tie', label: 'TIE' }
    ];
}

/**
 * Formatea un número de documento para mostrar
 * Elimina caracteres especiales y formatea
 */
export function formatearDocumento(numero, tipo) {
    if (!numero) return '—';

    // Eliminar espacios, guiones, puntos
    const clean = numero.toUpperCase().replace(/[\s\-\.]/g, '');

    if (tipo === 'dni' || tipo === 'nie') {
        // Formato: 12345678A
        return clean.substring(0, 8) + (clean[8] || '');
    }

    return clean;
}

/**
 * Calcula la cantidad de noches entre dos fechas
 * @returns {number}
 */
export function calcularNoches(checkIn, checkOut) {
    const entrada = checkIn instanceof Date ? checkIn : new Date(checkIn);
    const salida = checkOut instanceof Date ? checkOut : new Date(checkOut);

    const diferencia = salida - entrada;
    const noches = Math.ceil(diferencia / (24 * 60 * 60 * 1000));

    return Math.max(1, noches); // Mínimo 1 noche
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function obtenerDiaDelaSemana(fecha) {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[date.getDay()];
}

/**
 * Obtiene el número del día en formato 2 dígitos
 */
export function obtenerDiaNumero(fecha) {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return String(date.getDate()).padStart(2, '0');
}

/**
 * Obtiene el nombre del mes en español
 */
export function obtenerNombreMes(fecha) {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[date.getMonth()];
}

/**
 * Formatea un estado de reserva para mostrar
 */
export function formatearEstadoReserva(estado) {
    const estados = {
        pendiente: 'Pendiente',
        confirmada: 'Confirmada',
        cancelada: 'Cancelada',
        completada: 'Completada',
    };

    return estados[estado?.toLowerCase()] || estado || '—';
}

/**
 * Obtiene el color (clase) para un estado de reserva
 */
export function obtenerColorEstado(estado) {
    const colores = {
        pendiente: 'badge-warning',
        confirmada: 'badge-success',
        cancelada: 'badge-error',
        completada: 'badge-info',
    };

    return colores[estado?.toLowerCase()] || 'badge-neutral';
}

/**
 * Formatea opciones de estado de habitación
 */
export function obtenerOpcionesEstadoHabitacion() {
    return [
        { value: 'disponible', label: 'Disponible' },
        { value: 'ocupada', label: 'Ocupada' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'limpieza', label: 'Limpieza' },
    ];
}

/**
 * Obtiene el color para un estado de habitación
 */
export function obtenerColorEstadoHabitacion(estado) {
    const colores = {
        disponible: 'badge-success',
        ocupada: 'badge-error',
        mantenimiento: 'badge-warning',
        limpieza: 'badge-info',
    };

    return colores[estado?.toLowerCase()] || 'badge-neutral';
}

/**
 * Agrupa todas las utilidades en un objeto
 */
export const formatters = {
    fecha: formatearFecha,
    moneda: formatearMoneda,
    documento: {
        nombre: obtenerNombreDocumento,
        color: obtenerColorDocumento,
        opciones: obtenerOpcionesDocumento,
        formato: formatearDocumento,
    },
    noches: calcularNoches,
    dia: obtenerDiaDelaSemana,
    mes: obtenerNombreMes,
    estado: {
        reserva: formatearEstadoReserva,
        colorReserva: obtenerColorEstado,
        habitacion: obtenerOpcionesEstadoHabitacion,
        colorHabitacion: obtenerColorEstadoHabitacion,
    },
};

export default formatters;
